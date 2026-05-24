<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useAdmin } from './composables/useAdmin';
import { submitContactMessage, submitWaitlistLead } from './services/publicApi';
import { captureEvent, getAttribution } from './lib/analytics';
import iconColored from './assets/img/icons/icon-colored.png';
import iconLight from './assets/img/icons/icon-light.png';
import liaProfile from './assets/img/profiles/lia.png';
import mimiBotProfile from './assets/img/profiles/mimi-bot.png';
import namiProfile from './assets/img/profiles/nami.png';
import sayuProfile from './assets/img/profiles/sayu.png';
import namiPhotoOne from './assets/img/posts/nami-photo-1.png';
import namiPhotoTwo from './assets/img/posts/nami-photo-2.png';
import namiPhotoThree from './assets/img/posts/nami-photo-3.png';
import sayuPhotoOne from './assets/img/posts/sayu-photo-1.png';

const safetySection = ref(null);
const mockupSection = ref(null);
const observers = [];
const transientPostTimeouts = [];
let demoInterval;
let toastTimeout;
let composerModalCloseTimeout;

const attribution = reactive({
  source: 'landing',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  referrer: ''
});

const form = reactive({
  name: '',
  email: '',
  age: '',
  cityState: '',
  identity: '',
  customIdentity: '',
  lookingFor: [],
  wantsToMeet: [],
  betaInterest: '',
  contactHandle: '',
  biggestPain: '',
  comment: ''
});

const currentStep = ref(1);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const formStarted = ref(false);
const currentPage = ref('home');
const mobileMenuOpen = ref(false);
const headerRef = ref(null);
const composerModalOpen = ref(false);
const composerModalRendered = ref(false);
const composerModalClosing = ref(false);
const contactForm = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
});
const contactSubmitting = ref(false);
const contactError = ref('');
const contactSuccess = ref('');
const {
  adminToken,
  adminDashboard,
  adminLoading,
  adminError,
  adminSuccess,
  adminLoginForm,
  adminRegisterForm,
  adminRegisterSubmitting,
  adminLoginSubmitting,
  formatDateTime,
  formatListValue,
  loadAdminDashboard,
  handleAdminLogin,
  handleAdminRegister,
  handleAdminLogout
} = useAdmin({ setPage });

const totalSteps = 3;

const formSteps = [
  {
    number: 1,
    title: 'Sobre você',
    text: 'O básico para sabermos quem chamar quando o beta abrir.'
  },
  {
    number: 2,
    title: 'Sua vibe',
    text: 'Ajude o Mimi a entender o tipo de comunidade e conexão que faz sentido para você.'
  },
  {
    number: 3,
    title: 'Beta',
    text: 'Últimos detalhes para convite, contato e aprendizado de produto.'
  }
];

const navLinks = [
  { label: 'Como funciona', target: 'como-funciona' },
  { label: 'Comunidades', target: 'comunidades' },
  { label: 'Segurança', target: 'seguranca' },
  { label: 'Lista de espera', target: 'lista-de-espera' }
];

const legalPages = {
  termos: {
    eyebrow: 'Termos',
    title: 'Termos de uso',
    intro:
      'Estes termos explicam as regras básicas para participar da validação do Mimi enquanto o produto ainda está em beta fechado.',
    sections: [
      {
        title: 'Uso do beta',
        text: 'O Mimi está em fase de validação. Recursos, convites e acesso podem mudar conforme aprendemos com a comunidade.'
      },
      {
        title: 'Comunidade 18+',
        text: 'A primeira versão do Mimi é planejada para pessoas adultas. Conteúdos e interações devem respeitar limites, consentimento e legislação aplicável.'
      },
      {
        title: 'Conduta',
        text: 'Assédio, fetichização invasiva, discurso de ódio, exposição de dados pessoais e qualquer tentativa de burlar ferramentas de segurança não são aceitos.'
      },
      {
        title: 'Conteúdo',
        text: 'Cada pessoa é responsável pelo que publica. O Mimi poderá remover conteúdos ou limitar acesso quando houver risco para a comunidade.'
      }
    ]
  },
  privacidade: {
    eyebrow: 'Privacidade',
    title: 'Política de privacidade',
    intro:
      'A lista de espera coleta apenas dados necessários para validar o produto, priorizar convites e entender as necessidades da comunidade.',
    sections: [
      {
        title: 'Dados coletados',
        text: 'Podemos coletar nome ou apelido, e-mail, idade, cidade/estado, identidade declarada, interesses, contato social opcional e respostas abertas.'
      },
      {
        title: 'Como usamos',
        text: 'Usamos os dados para operar a lista de espera, chamar pessoas para o beta, melhorar posicionamento do produto e responder contatos enviados pelo site.'
      },
      {
        title: 'Compartilhamento',
        text: 'Não vendemos dados pessoais. Dados podem ser tratados por ferramentas técnicas necessárias para hospedagem, analytics e operação da API.'
      },
      {
        title: 'Controle',
        text: 'Você pode pedir correção ou remoção dos seus dados entrando em contato pela página de contato.'
      }
    ]
  }
};

const heroSignals = ['Feed em vez de swipe', 'DM só por convite', 'Comunidades desde o beta', '18+'];

const conceptFlow = ['Post', 'Afinidade', 'Comentário', 'Convite', 'Conversa'];

const problemCards = [
  {
    label: 'Feed',
    title: 'Sem cardápio de perfis',
    text: 'A descoberta começa pelo que a pessoa compartilha, não só por foto e bio.'
  },
  {
    label: 'DM',
    title: 'Sem DM invasiva',
    text: 'Mensagem privada começa com convite aceito.'
  },
  {
    label: 'Vibe',
    title: 'Sem explicar sua vibe toda hora',
    text: 'Interesses, limites e comunidades ajudam as pessoas certas a chegarem melhor.'
  }
];

const howItWorks = [
  {
    title: 'Poste',
    text: 'Compartilhe pensamentos, looks, memes, perguntas, imagens ou desabafos.',
    lines: ['novo post', 'looks pastel', 'pergunta sincera']
  },
  {
    title: 'Descubra',
    text: 'O feed Pra Você prioriza posts e comunidades compatíveis com sua vibe.',
    lines: ['Pra Você', '82% afinidade', 'Femboys BR']
  },
  {
    title: 'Conecte',
    text: 'Dê mimos, comente, siga e envie convites quando fizer sentido.',
    lines: ['Dar mimo', 'Comentar', 'Enviar convite']
  }
];

const communities = [
  {
    name: 'Femboys BR',
    description: 'Posts, dúvidas, looks e desabafos.'
  },
  {
    name: 'Meninas que gostam de femboys',
    description: 'Um espaço para conexões com respeito.'
  },
  {
    name: 'Pessoas soft',
    description: 'Estética, conversas leves e pertencimento.'
  },
  {
    name: 'Femboys héteros',
    description: 'Vivências, dúvidas e conexões sem presunções.'
  },
  {
    name: 'Looks e estética',
    description: 'Inspirações, feedbacks e estilo.'
  },
  {
    name: 'Games',
    description: 'Coop, fandoms e conversa leve.'
  },
  {
    name: 'Anime',
    description: 'Recomendações, personagens e edits.'
  },
  {
    name: 'Tecnologia',
    description: 'Projetos, setups e curiosidades.'
  },
  {
    name: 'Desabafos',
    description: 'Um canto para falar sem performar.'
  },
  {
    name: 'Relacionamentos',
    description: 'Afeto, limites e cuidado.'
  }
];

const identityOptions = [
  'Femboy',
  'Garoto feminino',
  'Soft boy',
  'Andrógino(a)',
  'Tomboy',
  'Garota',
  'Garoto',
  'Pessoa queer',
  'Pessoa não-binária',
  'Pessoa alternativa',
  'Admirador(a) respeitoso(a)',
  'Prefiro escrever'
];

const lookingForOptions = [
  'Amizades',
  'Romance',
  'Comunidades',
  'Conversas leves',
  'Pessoas parecidas comigo',
  'Pessoas que gostem da minha vibe',
  'Ainda não sei'
];

const wantsToMeetOptions = [
  'Femboys',
  'Meninas',
  'Garotos femininos',
  'Pessoas andróginas',
  'Pessoas soft/alternativas',
  'Todo mundo',
  'Só amizade por enquanto'
];

const betaOptions = ['Sim', 'Talvez', 'Não agora'];

const safetyCards = [
  {
    title: 'DM só por convite',
    text: 'A conversa privada começa quando a outra pessoa aceita.'
  },
  {
    title: 'Denúncia e bloqueio',
    text: 'Ferramentas claras para cortar contato ruim sem atrito.'
  },
  {
    title: 'Limites visíveis no perfil',
    text: 'Preferências ajudam a conversa a começar no tom certo.'
  },
  {
    title: 'Comunidades com regras',
    text: 'Cada canto do Mimi precisa de cultura e moderação.'
  },
  {
    title: '18+',
    text: 'O beta inicial será uma comunidade adulta.'
  },
  {
    title: 'Moderação desde o beta',
    text: 'Segurança é parte do produto desde o primeiro teste.'
  }
];

const feedPosts = [
  {
    author: 'Lia',
    community: 'Pessoas soft',
    text: 'Queria um lugar onde eu pudesse postar meus looks e conversar sem virar fetiche.',
    mimos: 128,
    comments: 24,
    tone: 'pink'
  },
  {
    author: 'sayu',
    community: 'Femboys BR',
    text: 'Ser femboy hétero é estranho porque todo mundo assume que você é gay. Alguém mais passa por isso?',
    mimos: 93,
    comments: 31,
    tone: 'blue'
  },
  {
    author: 'Nami',
    community: 'Conversas leves',
    text: 'Menos swipe, mais conversa boa. É pedir muito?',
    mimos: 176,
    comments: 18,
    tone: 'cream'
  }
];

const profileImages = {
  Lia: liaProfile,
  'Mimi Bot': mimiBotProfile,
  Nami: namiProfile,
  sayu: sayuProfile
};

const demoSeedPosts = [
  {
    id: 'lia-soft',
    author: 'Lia',
    community: 'Pessoas soft',
    time: 'agora',
    text: 'Queria um lugar onde eu pudesse postar meus looks e conversar sem virar fetiche.',
    tags: ['looks', 'limites claros', 'conversa leve'],
    mimos: 128,
    tone: 'pink',
    media: null,
    liked: false,
    followed: false,
    comments: [
      { author: 'Nami', text: 'Esse tipo de espaço faz muita falta.' },
      { author: 'sayu', text: 'Sim. Quando o contexto vem primeiro tudo fica mais leve.' }
    ]
  },
  {
    id: 'kael-femboys',
    author: 'sayu',
    community: 'Femboys BR',
    time: '12 min',
    text: 'Ser femboy hétero é estranho porque todo mundo assume que você é gay. Alguém mais passa por isso?',
    tags: ['vivência', 'pergunta sincera'],
    mimos: 93,
    tone: 'blue',
    media: null,
    liked: false,
    followed: false,
    comments: [
      { author: 'Lia', text: 'Já vi muita gente falando disso. Ter um canto para conversar ajuda.' }
    ]
  },
  {
    id: 'nami-look',
    author: 'Nami',
    community: 'Looks e estética',
    time: '25 min',
    text: 'Look pastel com jaqueta oversized. Aceito ideias de acessórios.',
    tags: ['look', 'pastel', 'feedback'],
    mimos: 176,
    tone: 'cream',
    media: 'abstract',
    liked: true,
    followed: true,
    comments: [
      { author: 'Mimi Bot', text: 'Comentários com respeito mantêm a comunidade confortável.' }
    ]
  }
];

const richerDemoSeedPosts = [
  {
    id: 'sayu-isla',
    author: 'sayu',
    community: 'Femboys BR',
    time: 'agora',
    text: 'Hoje eu me senti tão fofinho e confortável com essas roupinhas... ficar abraçadinho com a minha Isla deixou tudo ainda mais quentinho por dentro.',
    tags: ['look', 'fofo', 'Plastic Memories'],
    mimos: 214,
    tone: 'pink',
    media: [{ src: sayuPhotoOne, alt: 'sayu com look fofo abraçando a Isla' }],
    liked: false,
    followed: true,
    comments: [
      { author: 'Nami', text: 'Essa energia ficou muito confortável.' },
      { author: 'Mimi Bot', text: 'Mimos fofos detectados com respeito.' }
    ]
  },
  {
    id: 'lia-soft',
    author: 'Lia',
    community: 'Pessoas soft',
    time: '18 min',
    text: 'Queria um lugar onde eu pudesse postar meus looks e conversar sem virar fetiche.',
    tags: ['looks', 'limites claros', 'conversa leve'],
    mimos: 128,
    tone: 'pink',
    media: [],
    liked: false,
    followed: false,
    comments: [
      { author: 'Nami', text: 'Esse tipo de espaço faz muita falta.' },
      { author: 'sayu', text: 'Sim. Quando o contexto vem primeiro tudo fica mais leve.' }
    ]
  },
  {
    id: 'sayu-femboys',
    author: 'sayu',
    community: 'Femboys BR',
    time: '24 min',
    text: 'Ser femboy hétero é estranho porque todo mundo assume que você é gay. Alguém mais passa por isso?',
    tags: ['vivência', 'pergunta sincera'],
    mimos: 93,
    tone: 'blue',
    media: [],
    liked: false,
    followed: false,
    comments: [
      { author: 'Lia', text: 'Já vi muita gente falando disso. Ter um canto para conversar ajuda.' }
    ]
  },
  {
    id: 'nami-look',
    author: 'Nami',
    community: 'Looks e estética',
    time: '32 min',
    text: 'Look pastel com jaqueta oversized. Aceito ideias de acessórios.',
    tags: ['look', 'pastel', 'feedback'],
    mimos: 176,
    tone: 'cream',
    media: [
      { src: namiPhotoOne, alt: 'Look da Nami no Mimi' },
      { src: namiPhotoTwo, alt: 'Detalhe do look da Nami' },
      { src: namiPhotoThree, alt: 'Foto complementar do look da Nami' }
    ],
    liked: true,
    followed: true,
    comments: [
      { author: 'Mimi Bot', text: 'Comentários com respeito mantêm a comunidade confortável.' }
    ]
  }
];

const simulatedPosts = [
  {
    author: 'Mimi Bot',
    community: 'Femboys BR',
    text: 'Nova thread no beta: como vocês gostariam que convites de conversa funcionassem?',
    tags: ['thread', 'produto'],
    tone: 'cream'
  },
  {
    author: 'Lia',
    community: 'Femboys BR',
    text: 'Abrindo conversa: quais comunidades deveriam existir no primeiro mês?',
    tags: ['comunidade', 'beta'],
    tone: 'pink'
  },
  {
    author: 'Nami',
    community: 'Pessoas soft',
    text: 'A melhor parte de um feed por afinidade é descobrir gente sem precisar se vender em bio.',
    tags: ['afinidade', 'feed'],
    tone: 'blue'
  }
];

const demoPosts = ref(richerDemoSeedPosts.map((post) => ({ ...post, comments: [...post.comments], media: [...post.media] })));
const demoView = ref('feed');
const activeTestPanel = ref('main');
const activeTestPanelDirection = ref('next');
const activeCommunity = ref('Femboys BR');
const composerText = ref('');
const composerImage = ref('');
const composerImageName = ref('');
const demoToast = ref('');
const commentDrafts = reactive({});
const openComments = reactive({});
const acceptedInvite = ref(false);
const mediaModal = reactive({
  isOpen: false,
  src: '',
  alt: ''
});
const inviteFilter = ref('todos');
const inviteSearch = ref('');
const chatOpen = ref(false);
const chatRendered = ref(false);
const chatClosing = ref(false);
const activeChatId = ref('sayu');
const chatDraft = ref('');
const chatMessagesRef = ref(null);
const chatLastSeen = reactive({});
let chatTimeout;
let chatCloseTimeout;
let chatMessageId = 0;
let simulatedPostIndex = 0;
let testPanelPointerStartX = 0;
let testPanelPointerStartY = 0;

const connectionInvites = reactive([
  {
    id: 'sayu',
    name: 'sayu',
    avatar: sayuProfile,
    community: 'Femboys BR',
    arrived: 'chegou há 12 min',
    text: 'Vocês têm interesses parecidos em games, looks e Femboys BR.',
    status: 'pendente'
  }
]);

const conversations = reactive([
  {
    id: 'sayu',
    name: 'sayu',
    avatar: sayuProfile,
    unread: 0,
    typing: false,
    replyCursor: 0,
    replies: [
      'eu vi seu mimo no post e fiquei todo felizinho',
      'você também gosta desse tipo de look mais confortável?',
      'tava pensando em postar outra foto com a Isla depois',
      'obrigado por puxar assunto com calma, isso dá um conforto real'
    ],
    messages: [
      { from: 'sayu', text: 'oii, vi que você abriu meu convite. posso conversar por aqui?', time: 'agora' },
      { from: 'Você', text: 'Pode sim, achei seu post muito fofo.', time: 'agora' }
    ]
  },
  {
    id: 'lia',
    name: 'Lia',
    avatar: liaProfile,
    unread: 0,
    typing: false,
    replyCursor: 0,
    replies: [
      'eu queria que mais redes fossem assim, com contexto antes de DM',
      'você também sente que comunidades deixam tudo mais leve?',
      'postar sem virar vitrine muda completamente a energia',
      'amei essa ideia de descobrir pessoas pelo que elas compartilham'
    ],
    messages: [
      { from: 'Lia', text: 'obrigada pelo comentário no post. esse espaço faz falta mesmo.', time: 'agora' }
    ]
  }
]);

const currentStepMeta = computed(() => formSteps[currentStep.value - 1]);
const currentLegalPage = computed(() => legalPages[currentPage.value] || null);
const showCustomIdentity = computed(() => form.identity === 'Prefiro escrever');
const featuredCommunities = computed(() => communities.slice(0, 3));
const secondaryCommunities = computed(() => communities.slice(3));
const activeCommunityMeta = computed(
  () => communities.find((community) => community.name === activeCommunity.value) || communities[0]
);
const filteredInvites = computed(() => {
  const search = inviteSearch.value.trim().toLowerCase();

  return connectionInvites.filter((invite) => {
    const matchesFilter = inviteFilter.value === 'todos' || invite.status === inviteFilter.value;
    const matchesSearch =
      !search ||
      invite.name.toLowerCase().includes(search) ||
      invite.community.toLowerCase().includes(search) ||
      invite.text.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });
});
const pendingInviteCount = computed(() => connectionInvites.filter((invite) => invite.status === 'pendente').length);
const acceptedInviteCount = computed(() => connectionInvites.filter((invite) => invite.status === 'aceito').length);
const activeConversation = computed(
  () => conversations.find((conversation) => conversation.id === activeChatId.value) || conversations[0]
);
const totalUnreadMessages = computed(() =>
  conversations.reduce((total, conversation) => total + conversation.unread, 0)
);
const latestUnreadConversation = computed(() =>
  conversations.find((conversation) => conversation.unread > 0) || activeConversation.value
);
const demoVisiblePosts = computed(() => {
  if (demoView.value === 'community') {
    return demoPosts.value.filter((post) => post.community === activeCommunity.value);
  }

  return demoPosts.value;
});
const activeTestPanelLabel = computed(() => {
  if (demoView.value === 'community') {
    return activeCommunity.value;
  }

  if (demoView.value === 'invites') {
    return 'Pedidos';
  }

  return 'Feed';
});
const testPanelTabs = computed(() => [
  {
    id: 'sidebar',
    label: 'Explorar',
    ariaLabel: 'Explorar feeds, comunidades e convites',
    icon: 'menu'
  },
  {
    id: 'main',
    label: activeTestPanelLabel.value,
    ariaLabel: `${activeTestPanelLabel.value} aberto no test-drive`,
    icon: 'home'
  },
  {
    id: 'right',
    label: 'Sugestões',
    ariaLabel: 'Sugestões, afinidades e segurança',
    icon: 'spark'
  }
]);

function resolvePageFromPath(pathname = window.location.pathname) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/admin') {
    return 'admin';
  }

  if (cleanPath === '/admin/login') {
    return 'admin-login';
  }

  if (cleanPath === '/admin/register') {
    return 'admin-register';
  }

  if (cleanPath === '/termos') {
    return 'termos';
  }

  if (cleanPath === '/privacidade') {
    return 'privacidade';
  }

  if (cleanPath === '/contato') {
    return 'contato';
  }

  return 'home';
}

function setPage(page, options = {}) {
  currentPage.value = page;
  mobileMenuOpen.value = false;

  const pathByPage = {
    home: '/',
    admin: '/admin',
    'admin-login': '/admin/login',
    'admin-register': '/admin/register',
    termos: '/termos',
    privacidade: '/privacidade',
    contato: '/contato'
  };
  const nextPath = pathByPage[page] || '/';

  if (!options.replace && window.location.pathname !== nextPath) {
    window.history.pushState({ page }, '', nextPath);
  } else if (options.replace) {
    window.history.replaceState({ page }, '', nextPath);
  }

  nextTick(() => {
    window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });
  });
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenuOnOutsideClick(event) {
  if (!mobileMenuOpen.value || headerRef.value?.contains(event.target)) {
    return;
  }

  mobileMenuOpen.value = false;
}

function scrollToSection(target) {
  if (currentPage.value !== 'home') {
    setPage('home', { instant: true });
    nextTick(() => scrollToSection(target));
    return;
  }

  mobileMenuOpen.value = false;
  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleWaitlistCta(location) {
  captureEvent('cta_waitlist_clicked', { location, ...attribution });
  scrollToSection('lista-de-espera');
}

function showDemoToast(message) {
  demoToast.value = message;
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    demoToast.value = '';
  }, 2600);
}

function setDemoView(view) {
  demoView.value = view;
  setActiveTestPanel('main');
  showDemoToast(view === 'feed' ? 'Feed Pra Você aberto.' : 'Área do Mimi atualizada.');
}

function openCommunity(name = 'Femboys BR') {
  activeCommunity.value = name;
  demoView.value = 'community';
  setActiveTestPanel('main');
  showDemoToast(`${name} aberta no test-drive.`);
}

function setActiveTestPanel(panel) {
  if (panel === activeTestPanel.value) {
    return;
  }

  const currentIndex = testPanelTabs.value.findIndex((tab) => tab.id === activeTestPanel.value);
  const nextIndex = testPanelTabs.value.findIndex((tab) => tab.id === panel);
  activeTestPanelDirection.value = nextIndex >= currentIndex ? 'next' : 'prev';
  activeTestPanel.value = panel;
}

function resetTestPanelPointer() {
  testPanelPointerStartX = 0;
  testPanelPointerStartY = 0;
}

function handleTestPanelPointerStart(event) {
  testPanelPointerStartX = event.clientX;
  testPanelPointerStartY = event.clientY;
}

function handleTestPanelPointerEnd(event) {
  if (!testPanelPointerStartX) {
    return;
  }

  const deltaX = event.clientX - testPanelPointerStartX;
  const deltaY = event.clientY - testPanelPointerStartY;
  resetTestPanelPointer();

  if (Math.abs(deltaX) < 56 || Math.abs(deltaY) > Math.abs(deltaX) * 0.8) {
    return;
  }

  const currentIndex = testPanelTabs.value.findIndex((tab) => tab.id === activeTestPanel.value);
  const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
  const nextTab = testPanelTabs.value[Math.max(0, Math.min(testPanelTabs.value.length - 1, nextIndex))];

  if (nextTab && nextTab.id !== activeTestPanel.value) {
    setActiveTestPanel(nextTab.id);
  }
}

function markPostAsFresh(post) {
  post.isFresh = true;
  const timeout = window.setTimeout(() => {
    post.isFresh = false;
  }, 2200);
  transientPostTimeouts.push(timeout);
}

function openComposerModal() {
  window.clearTimeout(composerModalCloseTimeout);
  composerModalRendered.value = true;
  composerModalClosing.value = false;
  composerModalOpen.value = true;
}

function closeComposerModal() {
  composerModalClosing.value = true;
  composerModalOpen.value = false;
  window.clearTimeout(composerModalCloseTimeout);
  composerModalCloseTimeout = window.setTimeout(() => {
    composerModalRendered.value = false;
    composerModalClosing.value = false;
  }, 220);
}

function publishDemoPost() {
  const text = composerText.value.trim();

  if (!text && !composerImage.value) {
    showDemoToast('Escreva algo ou adicione uma imagem para publicar.');
    openComposerModal();
    return false;
  }

  const post = {
    id: `you-${Date.now()}`,
    author: 'Você',
    community: demoView.value === 'community' ? activeCommunity.value : 'Pessoas soft',
    time: 'agora',
    text: text || 'Compartilhei uma imagem no Mimi.',
    tags: ['novo post', 'beta'],
    mimos: 0,
    tone: 'cream',
    media: composerImage.value ? [{ src: composerImage.value, alt: 'Imagem publicada por você' }] : [],
    liked: false,
    followed: true,
    comments: []
  };

  demoPosts.value.unshift(post);
  markPostAsFresh(post);
  composerText.value = '';
  composerImage.value = '';
  composerImageName.value = '';
  closeComposerModal();
  showDemoToast('Post publicado só neste test-drive.');
  return true;
}

function handleDemoImageUpload(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    showDemoToast('Escolha uma imagem para anexar ao post.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    composerImage.value = String(reader.result || '');
    composerImageName.value = file.name;
    showDemoToast('Imagem anexada ao post.');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function removeDemoImage() {
  composerImage.value = '';
  composerImageName.value = '';
}

function getAuthorAvatar(author) {
  return profileImages[author] || '';
}

function displayName(name) {
  return name === 'sayu' ? 'Sayu' : name;
}

function openMediaModal(media) {
  mediaModal.src = media.src;
  mediaModal.alt = media.alt || 'Imagem publicada no Mimi';
  mediaModal.isOpen = true;
}

function closeMediaModal() {
  mediaModal.isOpen = false;
  mediaModal.src = '';
  mediaModal.alt = '';
}

function toggleMimo(post) {
  post.liked = !post.liked;
  post.mimos += post.liked ? 1 : -1;
  post.pulse = true;
  window.setTimeout(() => {
    post.pulse = false;
  }, 360);
}

function toggleFollow(post) {
  post.followed = !post.followed;
  showDemoToast(post.followed ? `Você seguiu ${post.author}.` : `Você deixou de seguir ${post.author}.`);
}

function toggleComments(postId) {
  openComments[postId] = !openComments[postId];
}

function addDemoComment(post) {
  const text = (commentDrafts[post.id] || '').trim();

  if (!text) {
    return;
  }

  post.comments.push({ author: 'Você', text });
  commentDrafts[post.id] = '';
  openComments[post.id] = true;
  showDemoToast('Comentário adicionado em memória.');
}

function acceptInvite() {
  acceptedInvite.value = true;
  showDemoToast('Convite aceito. A conversa ficou disponível.');
}

function rejectInvite(invite) {
  invite.status = 'recusado';
  showDemoToast('Convite recusado só neste test-drive.');
}

function createChatMessage(from, text, options = {}) {
  chatMessageId += 1;

  return {
    id: `chat-${Date.now()}-${chatMessageId}`,
    from,
    text,
    visibleText: options.reveal ? '' : text,
    time: 'agora',
    isRevealing: Boolean(options.reveal)
  };
}

function revealChatMessage(message, options = {}) {
  const duration = Math.min(1000, Math.max(480, message.text.length * 18));
  const startedAt = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const nextLength = Math.max(1, Math.ceil(message.text.length * progress));
    message.visibleText = message.text.slice(0, nextLength);

    if (options.scroll) {
      scrollChatToBottom();
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    message.visibleText = message.text;
    message.isRevealing = false;

    if (options.scroll) {
      scrollChatToBottom();
    }
  }

  window.requestAnimationFrame(step);
}

function pushChatMessage(conversation, from, text, options = {}) {
  conversation.messages.push(createChatMessage(from, text, options));
  const message = conversation.messages[conversation.messages.length - 1];

  if (options.scroll) {
    scrollChatToBottom();
  }

  if (options.reveal) {
    revealChatMessage(message, { scroll: Boolean(options.scroll) });
  }
}

function rememberLastSeenChatMessage() {
  const container = chatMessagesRef.value;

  if (!container || !activeConversation.value) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const messages = [...container.querySelectorAll('[data-message-id]')];
  let lastVisibleId = '';

  for (const message of messages) {
    const rect = message.getBoundingClientRect();
    const isVisible = rect.bottom > containerRect.top + 8 && rect.top < containerRect.bottom - 8;

    if (isVisible) {
      lastVisibleId = message.dataset.messageId || '';
    }
  }

  if (lastVisibleId) {
    chatLastSeen[activeConversation.value.id] = lastVisibleId;
  }
}

function restoreChatPosition(id) {
  nextTick(() => {
    const container = chatMessagesRef.value;
    const seenId = chatLastSeen[id];

    if (!container || !seenId) {
      return;
    }

    const target = container.querySelector(`[data-message-id="${CSS.escape(seenId)}"]`);

    if (!target) {
      return;
    }

    target.scrollIntoView({ block: 'center' });
  });
}

function scrollChatToBottom() {
  nextTick(() => {
    const container = chatMessagesRef.value;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  });
}

function openChat(id = activeChatId.value) {
  if (chatOpen.value && id !== activeChatId.value) {
    rememberLastSeenChatMessage();
  }

  activeChatId.value = id;
  window.clearTimeout(chatCloseTimeout);
  chatRendered.value = true;
  chatClosing.value = false;
  chatOpen.value = true;
  const conversation = conversations.find((item) => item.id === id);

  if (conversation) {
    conversation.unread = 0;
  }

  restoreChatPosition(id);
}

function minimizeChat() {
  rememberLastSeenChatMessage();
  chatClosing.value = true;
  chatOpen.value = false;
  window.clearTimeout(chatCloseTimeout);
  chatCloseTimeout = window.setTimeout(() => {
    chatRendered.value = false;
    chatClosing.value = false;
  }, 280);
}

function sendChatMessage() {
  const text = chatDraft.value.trim();

  if (!text || !activeConversation.value) {
    return;
  }

  pushChatMessage(activeConversation.value, 'Você', text, { reveal: true, scroll: true });
  chatDraft.value = '';
}

function receiveAutoMessage() {
  const availableConversations = conversations.filter(
    (conversation) => conversation.replyCursor < conversation.replies.length && !conversation.typing
  );

  if (availableConversations.length === 0) {
    return false;
  }

  const conversation = availableConversations[Math.floor(Math.random() * availableConversations.length)];
  const text = conversation.replies[conversation.replyCursor];
  conversation.replyCursor += 1;

  conversation.typing = true;
  window.setTimeout(() => {
    conversation.typing = false;
    pushChatMessage(conversation, conversation.name, text, { reveal: true });

    if (!chatOpen.value || activeChatId.value !== conversation.id) {
      conversation.unread += 1;
    }
  }, 900 + Math.floor(Math.random() * 900));

  return true;
}

function scheduleChatMessage() {
  window.clearTimeout(chatTimeout);
  chatTimeout = window.setTimeout(() => {
    if (receiveAutoMessage()) {
      scheduleChatMessage();
    }
  }, 6500 + Math.floor(Math.random() * 8500));
}

function acceptConnectionInvite(invite = connectionInvites[0]) {
  invite.status = 'aceito';
  acceptedInvite.value = true;
  openChat(invite.id);
  showDemoToast('Convite aceito. A conversa ficou disponível.');
}

function addSimulatedPost() {
  const source = simulatedPosts[simulatedPostIndex % simulatedPosts.length];
  simulatedPostIndex += 1;

  if (demoPosts.value.some((post) => post.id === `live-${simulatedPostIndex}`) || demoPosts.value.length > 8) {
    return;
  }

  const post = {
    id: `live-${simulatedPostIndex}`,
    author: source.author,
    community: source.community,
    time: 'agora',
    text: source.text,
    tags: source.tags,
    mimos: 12 + simulatedPostIndex * 3,
    tone: source.tone,
    media: [],
    liked: false,
    followed: false,
    comments: [{ author: 'Mimi Bot', text: 'Publicação ao vivo do test-drive.' }]
  };

  demoPosts.value.unshift(post);
  markPostAsFresh(post);
}

function handleFormStarted() {
  if (formStarted.value) {
    return;
  }

  formStarted.value = true;
  captureEvent('form_started', attribution);
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function setStepError(step) {
  if (step === 1) {
    if (!form.name.trim() || !form.email.trim() || !form.age || !form.cityState.trim()) {
      errorMessage.value = 'Preencha todos os campos obrigatórios.';
      return false;
    }

    if (!isEmailValid(form.email)) {
      errorMessage.value = 'Informe um e-mail válido.';
      return false;
    }

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 18) {
      errorMessage.value = 'Por segurança, o Mimi será uma comunidade 18+ no beta inicial.';
      return false;
    }
  }

  if (step === 2) {
    if (!form.identity || form.lookingFor.length === 0 || form.wantsToMeet.length === 0) {
      errorMessage.value = 'Preencha todos os campos obrigatórios.';
      return false;
    }
  }

  if (step === 3 && !form.betaInterest) {
    errorMessage.value = 'Preencha todos os campos obrigatórios.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

function validateForm() {
  for (let step = 1; step <= totalSteps; step += 1) {
    if (!setStepError(step)) {
      currentStep.value = step;
      return false;
    }
  }

  return true;
}

function goToNextStep() {
  successMessage.value = '';

  if (!setStepError(currentStep.value)) {
    return;
  }

  currentStep.value = Math.min(currentStep.value + 1, totalSteps);
}

function goToPreviousStep() {
  errorMessage.value = '';
  successMessage.value = '';
  currentStep.value = Math.max(currentStep.value - 1, 1);
}

function resetForm() {
  form.name = '';
  form.email = '';
  form.age = '';
  form.cityState = '';
  form.identity = '';
  form.customIdentity = '';
  form.lookingFor = [];
  form.wantsToMeet = [];
  form.betaInterest = '';
  form.contactHandle = '';
  form.biggestPain = '';
  form.comment = '';
  currentStep.value = 1;
}

async function handleSubmit() {
  successMessage.value = '';

  if (!validateForm()) {
    captureEvent('waitlist_submit_failed', {
      reason: errorMessage.value,
      identity: form.identity,
      ...attribution
    });
    return;
  }

  isSubmitting.value = true;

  try {
    await submitWaitlistLead({
      ...form,
      age: Number(form.age),
      ...attribution
    });

    captureEvent('waitlist_submitted', {
      identity: form.identity,
      lookingFor: form.lookingFor,
      wantsToMeet: form.wantsToMeet,
      betaInterest: form.betaInterest,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign
    });

    successMessage.value = 'Você entrou na lista do Mimi 💜 Quando o beta estiver pronto, vamos te chamar.';
    resetForm();
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível entrar na lista agora.';
    captureEvent('waitlist_submit_failed', {
      reason: errorMessage.value,
      code: error.code || 'UNKNOWN_ERROR',
      identity: form.identity,
      ...attribution
    });
  } finally {
    isSubmitting.value = false;
  }
}

function handleStepSubmit() {
  if (currentStep.value < totalSteps) {
    goToNextStep();
    return;
  }

  void handleSubmit();
}

async function handleContactSubmit() {
  contactError.value = '';
  contactSuccess.value = '';

  if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
    contactError.value = 'Preencha todos os campos para enviar sua mensagem.';
    return;
  }

  if (!isEmailValid(contactForm.email)) {
    contactError.value = 'Informe um e-mail válido.';
    return;
  }

  contactSubmitting.value = true;

  try {
    await submitContactMessage({
      ...contactForm,
      source: 'contact_page'
    });

    contactSuccess.value = 'Mensagem enviada. Obrigado por falar com o Mimi.';
    contactForm.name = '';
    contactForm.email = '';
    contactForm.subject = '';
    contactForm.message = '';
  } catch (error) {
    contactError.value = error.message || 'Não foi possível enviar sua mensagem agora.';
  } finally {
    contactSubmitting.value = false;
  }
}

function observeSection(elementRef, eventName) {
  if (!('IntersectionObserver' in window) || !elementRef.value) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        captureEvent(eventName, attribution);
        observer.disconnect();
      }
    },
    { threshold: 0.35 }
  );

  observer.observe(elementRef.value);
  observers.push(observer);
}

function handlePopState() {
  currentPage.value = resolvePageFromPath();
  mobileMenuOpen.value = false;

  if (currentPage.value === 'admin') {
    void loadAdminDashboard();
  }
}

onMounted(() => {
  setPage(resolvePageFromPath(), { replace: true, instant: true });
  window.addEventListener('popstate', handlePopState);
  document.addEventListener('pointerdown', closeMobileMenuOnOutsideClick);
  Object.assign(attribution, getAttribution());
  captureEvent('landing_viewed', attribution);
  observeSection(safetySection, 'safety_section_viewed');
  observeSection(mockupSection, 'mockup_section_viewed');
  demoInterval = window.setInterval(addSimulatedPost, 9500);
  scheduleChatMessage();

  if (currentPage.value === 'admin') {
    void loadAdminDashboard();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
  document.removeEventListener('pointerdown', closeMobileMenuOnOutsideClick);
  observers.forEach((observer) => observer.disconnect());
  window.clearInterval(demoInterval);
  window.clearTimeout(chatTimeout);
  window.clearTimeout(chatCloseTimeout);
  window.clearTimeout(composerModalCloseTimeout);
  window.clearTimeout(toastTimeout);
  transientPostTimeouts.forEach((timeout) => window.clearTimeout(timeout));
});
</script>

<template>
  <div class="site-shell">
    <header ref="headerRef" class="header" :class="{ 'menu-open': mobileMenuOpen }">
      <a class="brand" href="/" aria-label="Mimi início" @click.prevent="setPage('home')">
        <span class="brand-mark" aria-hidden="true">
          <img :src="iconColored" alt="" />
        </span>
        <span class="brand-name">Mimi</span>
      </a>

      <nav class="nav-links" aria-label="Navegação principal">
        <button v-for="link in navLinks" :key="link.target" type="button" @click="scrollToSection(link.target)">
          {{ link.label }}
        </button>
      </nav>

      <button class="mobile-menu-button" type="button" :aria-expanded="mobileMenuOpen" aria-controls="mobile-menu" aria-label="Abrir menu" @click="toggleMobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <button class="button button-small button-primary header-cta" type="button" @click="handleWaitlistCta('header')">
        Entrar na lista
      </button>

      <nav id="mobile-menu" class="mobile-menu" aria-label="Menu principal mobile">
        <button v-for="link in navLinks" :key="`mobile-${link.target}`" type="button" @click="scrollToSection(link.target)">
          {{ link.label }}
        </button>
        <button type="button" @click="setPage('termos')">Termos</button>
        <button type="button" @click="setPage('privacidade')">Privacidade</button>
        <button type="button" @click="setPage('contato')">Contato</button>
      </nav>
    </header>

    <main v-if="currentPage === 'home'" id="top">
      <section class="hero section-band">
        <div class="hero-copy">
          <p class="eyebrow">Rede social de afinidade e comunidade</p>
          <h1>Menos swipe. Mais presença.</h1>
          <p class="hero-subtitle">
            Mimi é uma rede social para pessoas soft, femboys, andróginas e admiradores respeitosos se conectarem por
            posts, comunidades e afinidade.
          </p>
          <p class="hero-support">Conheça pessoas pelo que elas compartilham, não por um card de perfil.</p>

          <div class="hero-actions">
            <button class="button button-primary" type="button" @click="handleWaitlistCta('hero_primary')">
              Entrar na lista de espera
            </button>
            <button class="button button-ghost" type="button" @click="scrollToSection('como-funciona')">
              Ver como funciona
            </button>
          </div>

          <div class="signal-row" aria-label="Princípios do Mimi">
            <span v-for="signal in heroSignals" :key="signal">{{ signal }}</span>
          </div>
        </div>

        <div class="hero-stage hero-lite-stage" aria-label="Prévia social do Mimi">
          <div class="hero-feed-card hero-float-card">
            <span class="live-dot"></span>
            <strong>Lia publicou em Pessoas soft</strong>
            <p>Queria um lugar onde eu pudesse postar meus looks e conversar sem virar fetiche.</p>
            <div class="hero-mini-actions">
              <span>Dar mimo</span>
              <span>Comentar</span>
            </div>
          </div>

          <div class="hero-feed-card hero-float-card delay-one">
            <strong>Nami em Looks e estética</strong>
            <div class="hero-media-strip">
              <span><img :src="namiPhotoOne" alt="Foto da Nami no Mimi" /></span>
              <span><img :src="namiPhotoTwo" alt="Detalhe do look da Nami" /></span>
              <span><img :src="namiPhotoThree" alt="Outra foto da Nami" /></span>
            </div>
            <p>Look pastel + jaqueta oversized. Aceito ideias de acessórios.</p>
          </div>

          <div class="hero-dm-card hero-float-card delay-two">
            <span class="muted-label">Convite</span>
            <strong>Sayu quer conversar</strong>
            <p>Vocês têm interesses parecidos em games e comunidades.</p>
            <button type="button" @click="scrollToSection('mockups')">Abrir test-drive</button>
          </div>

          <div class="app-window">
            <div class="window-bar">
              <div class="window-dots"><span></span><span></span><span></span></div>
              <strong>Mimi</strong>
              <span>beta privado</span>
            </div>

            <div class="app-shell">
              <aside class="mock-sidebar">
                <div class="mini-logo">
                  <span aria-hidden="true"><img :src="iconColored" alt="" /></span>
                  Mimi
                </div>
                <button class="side-pill active" type="button">Pra Você</button>
                <button class="side-pill" type="button">Comunidades</button>
                <button class="side-pill" type="button">Laços</button>
                <button class="side-pill" type="button">Convites</button>
                <div class="sidebar-thread">
                  <span># Femboys BR</span>
                  <span># Pessoas soft</span>
                  <span># Looks e estética</span>
                </div>
                <div class="sidebar-card">
                  <span class="sidebar-kicker">cultura do beta</span>
                  <strong>DM por convite</strong>
                  <p>Privado só quando existe sinal dos dois lados.</p>
                </div>
              </aside>

              <section class="mock-feed">
                <div class="mock-topbar">
                  <div>
                    <span class="muted-label">Feed principal</span>
                    <strong>Pra Você</strong>
                  </div>
                  <span class="affinity-badge">82% afinidade</span>
                </div>

                <div class="composer-card">
                  <span class="avatar avatar-cream">M</span>
                  <div>
                    <strong>Compartilhe algo com o Mimi...</strong>
                    <p>Post, pergunta, look, meme ou desabafo.</p>
                  </div>
                  <button type="button">Postar</button>
                </div>

                <article class="mock-post featured-post">
                  <div class="post-head">
                    <span class="avatar avatar-pink">L</span>
                    <div>
                      <strong>Lia</strong>
                      <span>em Pessoas soft · agora</span>
                    </div>
                    <button type="button">Seguir</button>
                  </div>
                  <p>Queria um lugar onde eu pudesse postar meus looks e conversar sem virar fetiche.</p>
                  <div class="tag-row">
                    <span>looks</span>
                    <span>limites claros</span>
                    <span>conversa leve</span>
                  </div>
                  <div class="post-actions">
                    <button type="button">Dar mimo</button>
                    <button type="button">Comentar</button>
                    <span>128 mimos · 24 comentários</span>
                  </div>
                  <div class="comment-strip">
                    <span>Nami</span>
                    <p>Esse tipo de espaço faz muita falta.</p>
                  </div>
                </article>

                <article class="mock-post image-post">
                  <div class="post-head">
                    <span class="avatar avatar-blue">N</span>
                    <div>
                      <strong>Nami</strong>
                      <span>em Looks e estética</span>
                    </div>
                    <span class="post-chip">convite aberto</span>
                  </div>
                  <div class="fake-image">
                    <span><img :src="namiPhotoOne" alt="Foto da Nami" /></span>
                    <span><img :src="namiPhotoTwo" alt="Detalhe da Nami" /></span>
                    <span><img :src="namiPhotoThree" alt="Foto complementar da Nami" /></span>
                  </div>
                  <p>Look pastel com jaqueta oversized. Aceito ideias de acessórios.</p>
                  <div class="comment-preview">
                    <strong>Mimi Bot</strong>
                    <span>Comentários com respeito mantêm a comunidade confortável.</span>
                  </div>
                </article>
              </section>

              <aside class="mock-right">
                <div class="right-panel">
                  <span class="muted-label">Comunidade sugerida</span>
                  <strong>Femboys BR</strong>
                  <p>Posts, dúvidas, looks e desabafos.</p>
                  <button type="button">Ver comunidade</button>
                </div>

                <div class="right-panel affinity-panel">
                  <span class="muted-label">Afinidades de hoje</span>
                  <div class="affinity-list">
                    <span>looks</span>
                    <span>games</span>
                    <span>conversas leves</span>
                  </div>
                </div>

                <div class="right-panel invite-mini">
                  <span class="muted-label">Convite</span>
                  <strong>Sayu quer conversar</strong>
                  <p>Vocês têm interesses parecidos em games e looks.</p>
                </div>

                <div class="right-panel safety-mini">
                  <span class="muted-label">Segurança</span>
                  <strong>DM por convite</strong>
                  <p>Conexão precisa de consentimento.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section class="section-band problem-section">
        <div class="section-heading">
          <p class="eyebrow">O problema</p>
          <h2>Apps comuns transformam pessoas em cards.</h2>
          <p>
            Para muita gente soft, femboy ou andrógina, apps de namoro viram julgamento rápido, fetichização e conversa
            invasiva. O Mimi começa por contexto: posts, comunidades e interesses antes de qualquer DM.
          </p>
        </div>

        <div class="three-grid">
          <article v-for="card in problemCards" :key="card.title" class="info-card">
            <span class="card-icon">{{ card.label }}</span>
            <h3>{{ card.title }}</h3>
            <p>{{ card.text }}</p>
          </article>
        </div>
      </section>

      <section class="section-band concept-section">
        <div class="section-heading compact">
          <p class="eyebrow">Lógica social</p>
          <h2>No Mimi, o post vem antes do perfil.</h2>
          <p>A conexão nasce do que a pessoa compartilha. Primeiro vem o contexto. Depois vem a conversa.</p>
        </div>

        <div class="flow-track" aria-label="Fluxo de conexão do Mimi">
          <div v-for="(item, index) in conceptFlow" :key="item" class="flow-node">
            <span>{{ index + 1 }}</span>
            <strong>{{ item }}</strong>
          </div>
        </div>
      </section>

      <section id="como-funciona" class="section-band how-section">
        <div class="section-heading">
          <p class="eyebrow">Como funciona</p>
          <h2>Como o Mimi funciona</h2>
          <p>Uma experiência social com começo, meio e cuidado: você aparece pelo que compartilha, descobre por afinidade e conversa quando existe sinal.</p>
        </div>

        <div class="step-grid">
          <article v-for="(step, index) in howItWorks" :key="step.title" class="step-card">
            <div class="step-number">0{{ index + 1 }}</div>
            <div class="step-mini">
              <span v-for="line in step.lines" :key="line">{{ line }}</span>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </article>
        </div>
      </section>

      <section id="mockups" ref="mockupSection" class="section-band product-section">
        <div class="section-heading product-heading">
          <div>
            <p class="eyebrow">Produto</p>
            <h2>Um feed social primeiro. Conversa depois.</h2>
          </div>
          <p>No Mimi, a conexão nasce de contexto, comunidade e consentimento.</p>
        </div>

        <div class="test-drive-card app-window">
          <div class="window-bar">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <strong>Mimi</strong>
            <span>test-drive em memória</span>
          </div>

          <div
            class="test-drive-shell"
            :class="[`active-panel-${activeTestPanel}`, `panel-direction-${activeTestPanelDirection}`]"
            @pointerdown="handleTestPanelPointerStart"
            @pointerup="handleTestPanelPointerEnd"
            @pointercancel="resetTestPanelPointer"
          >
            <div class="test-mobile-brand" aria-hidden="true">
              <img :src="iconColored" alt="" />
              <span>Mimi</span>
            </div>

            <aside
              id="test-panel-sidebar"
              class="test-sidebar"
              :class="{ active: activeTestPanel === 'sidebar' }"
              role="tabpanel"
              aria-label="Menu do protótipo"
            >
              <div class="mini-logo">
                <span aria-hidden="true"><img :src="iconColored" alt="" /></span>
                Mimi
              </div>

              <button
                class="side-pill"
                :class="{ active: demoView === 'feed' }"
                type="button"
                @click="setDemoView('feed')"
              >
                Pra Você
              </button>
              <button
                class="side-pill"
                :class="{ active: demoView === 'community' }"
                type="button"
                @click="openCommunity('Femboys BR')"
              >
                Comunidades
              </button>
              <button
                class="side-pill"
                :class="{ active: demoView === 'invites' }"
                type="button"
                @click="setDemoView('invites')"
              >
                Convites
              </button>

              <div class="sidebar-thread">
                <button
                  v-for="community in communities.slice(0, 5)"
                  :key="community.name"
                  type="button"
                  :class="{ active: demoView === 'community' && activeCommunity === community.name }"
                  @click="openCommunity(community.name)"
                >
                  # {{ community.name }}
                </button>
              </div>
            </aside>

            <main
              id="test-panel-main"
              class="test-main"
              :class="{ active: activeTestPanel === 'main' }"
              role="tabpanel"
              aria-label="Conteúdo do protótipo"
            >
              <div v-if="demoView !== 'invites'" class="test-topbar">
                <div>
                  <span class="muted-label">{{ demoView === 'community' ? 'Comunidade' : 'Feed principal' }}</span>
                  <h3>{{ demoView === 'community' ? activeCommunityMeta.name : 'Pra Você' }}</h3>
                  <p>{{ demoView === 'community' ? activeCommunityMeta.description : 'Posts, comunidades e afinidade em tempo real.' }}</p>
                </div>
                <span class="affinity-badge">ao vivo</span>
              </div>

              <section v-if="demoView === 'invites'" class="invite-screen invite-screen-pro">
                <div class="invite-dashboard">
                  <div>
                    <span class="muted-label">Convites</span>
                    <h3>Pedidos de conversa</h3>
                    <p>Veja quem quer conversar e abra contexto antes de aceitar.</p>
                  </div>
                  <div class="invite-stats">
                    <span class="invite-stat">
                      <strong>{{ connectionInvites.length }}</strong>
                      <em>total</em>
                    </span>
                    <span class="invite-stat">
                      <strong>{{ pendingInviteCount }}</strong>
                      <em>pendentes</em>
                    </span>
                    <span class="invite-stat">
                      <strong>{{ acceptedInviteCount }}</strong>
                      <em>aceitos</em>
                    </span>
                  </div>
                </div>

                <div class="invite-toolbar">
                  <input v-model="inviteSearch" type="search" placeholder="Buscar por pessoa ou comunidade" />
                  <div>
                    <button type="button" :class="{ active: inviteFilter === 'todos' }" @click="inviteFilter = 'todos'">Todos</button>
                    <button type="button" :class="{ active: inviteFilter === 'pendente' }" @click="inviteFilter = 'pendente'">Pendentes</button>
                    <button type="button" :class="{ active: inviteFilter === 'aceito' }" @click="inviteFilter = 'aceito'">Aceitos</button>
                  </div>
                </div>

                <div class="invite-list">
                  <article v-for="invite in filteredInvites" :key="invite.id" class="invite-request-card">
                    <span class="invite-bg-icon" aria-hidden="true"></span>
                    <div class="invite-person">
                      <img :src="invite.avatar" :alt="`Foto de ${displayName(invite.name)}`" />
                      <div>
                        <strong>{{ displayName(invite.name) }} quer conversar com você</strong>
                        <span>{{ invite.arrived }} · {{ invite.community }}</span>
                      </div>
                    </div>
                    <p>{{ invite.text }}</p>
                    <div class="invite-actions">
                      <button type="button" @click="acceptConnectionInvite(invite)">
                        {{ invite.status === 'aceito' ? 'Aceito' : 'Aceitar' }}
                      </button>
                      <button type="button" @click="rejectInvite(invite)">Agora não</button>
                      <button type="button" @click="openCommunity(invite.community)">Ver contexto</button>
                    </div>
                  </article>
                </div>

                <div v-if="acceptedInvite" class="demo-chat">
                  <strong>Conversa liberada</strong>
                  <p>O chat com Sayu já está disponível no botão flutuante.</p>
                  <span>DM começa com convite aceito.</span>
                </div>
              </section>

              <section v-if="false" class="invite-screen">
                <div class="invite-orb"><img :src="sayuProfile" alt="Foto de Sayu" /></div>
                <h3>Sayu quer conversar com você</h3>
                <p>Vocês têm interesses parecidos em games, looks e Femboys BR.</p>
                <div class="invite-actions">
                  <button type="button" @click="acceptInvite">{{ acceptedInvite ? 'Aceito' : 'Aceitar' }}</button>
                  <button type="button" @click="setDemoView('feed')">Agora não</button>
                  <button type="button" @click="openCommunity('Femboys BR')">Ver contexto</button>
                </div>
                <div v-if="acceptedInvite" class="demo-chat">
                  <strong>Conversa liberada</strong>
                  <p>Oi, vi sua resposta na comunidade. Posso puxar assunto por ali?</p>
                  <span>DM começa com convite aceito.</span>
                </div>
              </section>

              <template v-if="demoView !== 'invites'">
                <section class="demo-composer">
                  <span class="demo-avatar user-avatar" aria-label="Seu perfil"></span>
                  <div class="composer-body">
                    <button class="composer-trigger" type="button" @click="openComposerModal">
                      <span>{{ composerText || 'Compartilhe algo com o Mimi...' }}</span>
                      <em v-if="composerImageName">{{ composerImageName }}</em>
                    </button>
                  </div>
                </section>

                <section class="demo-post-list" aria-live="polite">
                  <article
                    v-for="post in demoVisiblePosts"
                    :key="post.id"
                    class="demo-post"
                    :class="{ fresh: post.isFresh, pulse: post.pulse }"
                  >
                    <div class="demo-post-head">
                      <span class="demo-avatar" :class="`avatar-${post.tone}`">
                        <img v-if="getAuthorAvatar(post.author)" :src="getAuthorAvatar(post.author)" :alt="`Foto de ${displayName(post.author)}`" />
                        <span v-else>{{ post.author.charAt(0) }}</span>
                      </span>
                      <div>
                        <strong>{{ displayName(post.author) }}</strong>
                        <button type="button" @click="openCommunity(post.community)">em {{ post.community }}</button>
                        <span>{{ post.time }}</span>
                      </div>
                      <button class="follow-button" type="button" @click="toggleFollow(post)">
                        {{ post.followed ? 'Seguindo' : 'Seguir' }}
                      </button>
                    </div>

                    <p>{{ post.text }}</p>

                    <div
                      v-if="post.media.length"
                      class="demo-media"
                      :class="{ single: post.media.length === 1, carousel: post.media.length > 1 }"
                    >
                      <button
                        v-for="(media, mediaIndex) in post.media"
                        :key="`${post.id}-${media.src}`"
                        type="button"
                        :aria-label="`Expandir imagem ${mediaIndex + 1} de ${displayName(post.author)}`"
                        @click="openMediaModal(media)"
                      >
                        <img :src="media.src" :alt="media.alt" />
                      </button>
                    </div>

                    <div class="tag-row">
                      <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
                    </div>

                    <div class="demo-actions">
                      <button type="button" :class="{ active: post.liked }" @click="toggleMimo(post)">
                        {{ post.liked ? 'Mimo dado' : 'Dar mimo' }}
                      </button>
                      <button type="button" @click="toggleComments(post.id)">Comentar</button>
                      <span>{{ post.mimos }} mimos · {{ post.comments.length }} comentários</span>
                    </div>

                    <div v-if="openComments[post.id]" class="demo-comments">
                      <div v-for="comment in post.comments" :key="`${post.id}-${comment.author}-${comment.text}`">
                        <span class="comment-avatar" :class="{ 'user-avatar': comment.author === 'Você' }">
                          <img
                            v-if="getAuthorAvatar(comment.author)"
                            :src="getAuthorAvatar(comment.author)"
                            :alt="`Foto de ${displayName(comment.author)}`"
                          />
                        </span>
                        <div>
                          <strong>{{ displayName(comment.author) }}</strong>
                          <p>{{ comment.text }}</p>
                        </div>
                      </div>
                      <form @submit.prevent="addDemoComment(post)">
                        <input v-model="commentDrafts[post.id]" type="text" placeholder="Responder com respeito..." />
                        <button type="submit">Enviar</button>
                      </form>
                    </div>
                  </article>
                </section>
              </template>
            </main>

            <aside
              id="test-panel-right"
              class="test-right"
              :class="{ active: activeTestPanel === 'right' }"
              role="tabpanel"
              aria-label="Extras do protótipo"
            >
              <div class="right-panel">
                <span class="muted-label">Comunidade sugerida</span>
                <strong>Femboys BR</strong>
                <p>Posts, dúvidas, looks, conversas e threads.</p>
                <button type="button" @click="openCommunity('Femboys BR')">Ver comunidade</button>
              </div>

              <div class="right-panel affinity-panel">
                <span class="muted-label">Afinidades de hoje</span>
                <div class="affinity-list">
                  <span>looks</span>
                  <span>games</span>
                  <span>conversas leves</span>
                  <span>Femboys BR</span>
                </div>
              </div>

              <div class="right-panel invite-mini">
                <span class="muted-label">Convite</span>
                <strong>Sayu quer conversar</strong>
                <p>Mensagem privada começa com aceite.</p>
                <button type="button" @click="setDemoView('invites')">Abrir convite</button>
              </div>

              <div class="right-panel safety-mini">
                <span class="muted-label">Segurança</span>
                <strong>DM por convite</strong>
                <p>Conexão precisa de consentimento.</p>
              </div>
            </aside>

            <nav class="test-mobile-dock" aria-label="Navegação do protótipo">
              <button class="dock-feed" type="button" :class="{ active: demoView === 'feed' }" @click="setDemoView('feed')">
                <span></span>
                <em>Feed</em>
              </button>
              <button class="dock-community" type="button" :class="{ active: demoView === 'community' }" @click="openCommunity('Femboys BR')">
                <span></span>
                <em>Comunidades</em>
              </button>
              <button class="dock-compose" type="button" @click="openComposerModal">
                <span></span>
                <em>Postar</em>
              </button>
              <button class="dock-invites" type="button" :class="{ active: demoView === 'invites' }" @click="setDemoView('invites')">
                <span></span>
                <em>Convites</em>
              </button>
              <button class="dock-chat" type="button" @click="openChat(activeChatId)">
                <span></span>
                <em>Chat</em>
              </button>
            </nav>

            <nav class="test-panel-tabs" role="tablist" aria-label="Áreas do test-drive">
              <button
                v-for="tab in testPanelTabs"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="activeTestPanel === tab.id"
                :aria-controls="`test-panel-${tab.id}`"
                :aria-label="tab.ariaLabel"
                :class="[`panel-tab-${tab.icon}`, { active: activeTestPanel === tab.id }]"
                @click="setActiveTestPanel(tab.id)"
              >
                <span aria-hidden="true"></span>
                <em>{{ tab.label }}</em>
              </button>
            </nav>
          </div>

          <p v-if="demoToast" class="demo-toast">{{ demoToast }}</p>

          <div
            v-if="composerModalRendered"
            class="composer-modal"
            :class="{ closing: composerModalClosing }"
            role="dialog"
            aria-modal="true"
            aria-label="Criar post no Mimi"
            @click.self="closeComposerModal"
          >
            <form class="composer-modal-card" @submit.prevent="publishDemoPost">
              <header>
                <div>
                  <span class="muted-label">Novo post</span>
                  <strong>Compartilhe no Mimi</strong>
                </div>
                <button type="button" aria-label="Fechar compositor" @click="closeComposerModal">Fechar</button>
              </header>

              <textarea v-model="composerText" rows="5" placeholder="Compartilhe algo com o Mimi..."></textarea>

              <div v-if="composerImage" class="composer-image-preview">
                <img :src="composerImage" alt="Imagem anexada ao post" />
                <button type="button" @click="removeDemoImage">Remover imagem</button>
              </div>

              <div class="composer-tools">
                <label class="upload-pill">
                  <input type="file" accept="image/*" @change="handleDemoImageUpload" />
                  <span>{{ composerImageName || 'Adicionar imagem' }}</span>
                </label>
                <button type="submit">Publicar</button>
              </div>
            </form>
          </div>

          <div v-if="mediaModal.isOpen" class="media-modal" role="dialog" aria-modal="true" @click.self="closeMediaModal">
            <button class="media-modal-close" type="button" aria-label="Fechar imagem" @click="closeMediaModal">Fechar</button>
            <img :src="mediaModal.src" :alt="mediaModal.alt" />
          </div>

          <div class="floating-chat" :class="{ open: chatOpen }">
            <div v-if="!chatOpen && totalUnreadMessages > 0" class="chat-peek" @click="openChat(latestUnreadConversation.id)">
              <img :src="latestUnreadConversation.avatar" :alt="`Foto de ${displayName(latestUnreadConversation.name)}`" />
              <span>{{ totalUnreadMessages }}</span>
            </div>

            <button class="chat-fab" type="button" aria-label="Abrir chat do Mimi" @click="openChat(activeChatId)">
              <img :src="iconLight" alt="" />
              <span v-if="totalUnreadMessages > 0">{{ totalUnreadMessages }}</span>
            </button>

            <section v-if="chatRendered" class="chat-panel" :class="{ closing: chatClosing }" aria-label="Chat do Mimi">
              <header>
                <div>
                  <span class="muted-label">Mensagens</span>
                  <strong>Conversas</strong>
                </div>
                <button type="button" @click="minimizeChat">Minimizar</button>
              </header>

              <div class="chat-layout">
                <aside class="chat-list">
                  <button
                    v-for="conversation in conversations"
                    :key="conversation.id"
                    type="button"
                    :class="{ active: activeChatId === conversation.id }"
                    @click="openChat(conversation.id)"
                  >
                    <img :src="conversation.avatar" :alt="`Foto de ${displayName(conversation.name)}`" />
                    <span>
                      <strong>{{ displayName(conversation.name) }}</strong>
                      <small>{{ conversation.typing ? 'digitando...' : conversation.messages.at(-1)?.text }}</small>
                    </span>
                    <em v-if="conversation.unread">{{ conversation.unread }}</em>
                  </button>
                </aside>

                <main class="chat-window">
                  <div class="chat-person">
                    <img :src="activeConversation.avatar" :alt="`Foto de ${displayName(activeConversation.name)}`" />
                    <div>
                      <strong>{{ displayName(activeConversation.name) }}</strong>
                      <span>{{ activeConversation.typing ? 'digitando...' : 'online no test-drive' }}</span>
                    </div>
                  </div>

                  <div ref="chatMessagesRef" class="chat-messages" @scroll="rememberLastSeenChatMessage">
                    <p
                      v-for="(message, index) in activeConversation.messages"
                      :key="message.id || `${activeConversation.id}-${index}-${message.text}`"
                      :data-message-id="message.id || `${activeConversation.id}-initial-${index}`"
                      :class="{ mine: message.from === 'Você', revealing: message.isRevealing }"
                    >
                      <span class="chat-message-text">
                        <span class="chat-message-ghost">{{ message.text }}</span>
                        <span class="chat-message-live">{{ message.visibleText ?? message.text }}</span>
                      </span>
                      <small>{{ message.time }}</small>
                    </p>
                    <p v-if="activeConversation.typing" class="typing-bubble">
                      <span>digitando...</span>
                    </p>
                  </div>

                  <form class="chat-compose" @submit.prevent="sendChatMessage">
                    <input v-model="chatDraft" type="text" :placeholder="`Responder ${displayName(activeConversation.name)}...`" />
                    <button type="submit">Enviar</button>
                  </form>
                </main>
              </div>
            </section>
          </div>
        </div>

        <div class="product-grid">
          <article class="product-card feed-preview">
            <div class="card-header">
              <span>Feed Pra Você</span>
              <strong>Posts recomendados por afinidade</strong>
            </div>
            <div v-for="post in feedPosts" :key="post.author" class="feed-row">
              <div class="post-head">
                <span class="avatar" :class="`avatar-${post.tone}`">{{ post.author.charAt(0) }}</span>
                <div>
                  <strong>{{ post.author }}</strong>
                  <span>{{ post.community }}</span>
                </div>
                <button type="button">Dar mimo</button>
              </div>
              <p>{{ post.text }}</p>
              <div class="mini-stats">
                <span>{{ post.mimos }} mimos</span>
                <span>{{ post.comments }} comentários</span>
              </div>
            </div>
          </article>

          <article class="product-card communities-preview">
            <div class="card-header">
              <span>Comunidades</span>
              <strong>Cantos para participar</strong>
            </div>
            <div class="community-list">
              <div v-for="community in communities.slice(0, 8)" :key="community.name" class="community-row">
                <span>#</span>
                <div>
                  <strong>{{ community.name }}</strong>
                  <small>em validação</small>
                </div>
              </div>
            </div>
          </article>

          <article class="product-card profile-preview">
            <div class="profile-cover"></div>
            <div class="profile-body">
              <span class="avatar avatar-large avatar-pink">L</span>
              <div>
                <strong>Lia</strong>
                <p>Andrógina · soft · games · looks pastel · conversas calmas.</p>
              </div>
              <div class="tag-row">
                <span>conversas leves primeiro</span>
                <span>limites claros</span>
                <span>romance leve</span>
              </div>
              <div class="profile-meta">
                <span>Comunidades</span>
                <strong>Looks e estética · Pessoas soft · Games</strong>
              </div>
              <div class="recent-posts">
                <small>Posts recentes</small>
                <p>Look novo + pergunta sincera: como vocês lidam com elogio estranho?</p>
              </div>
            </div>
          </article>

          <article class="product-card invite-preview">
            <div class="invite-orb">Mi</div>
            <h3>Lia quer conversar com você</h3>
            <p>No Mimi, mensagem privada começa com convite. Conexão precisa de consentimento.</p>
            <div class="invite-actions">
              <button type="button">Aceitar</button>
              <button type="button">Recusar</button>
              <button type="button">Ver perfil</button>
            </div>
          </article>
        </div>
      </section>

      <section id="comunidades" class="section-band communities-section">
        <div class="section-heading">
          <p class="eyebrow">Comunidades</p>
          <h2>Encontre seu canto dentro do Mimi.</h2>
          <p>Comunidades são o ponto de partida para posts, conversas, amizades e laços.</p>
        </div>

        <div class="community-feature-grid">
          <article v-for="community in featuredCommunities" :key="community.name" class="community-card featured-community">
            <span>#</span>
            <h3>{{ community.name }}</h3>
            <p>{{ community.description }}</p>
          </article>
        </div>

        <div class="community-chip-grid">
          <article v-for="community in secondaryCommunities" :key="community.name" class="community-card small-community">
            <span>#</span>
            <div>
              <h3>{{ community.name }}</h3>
              <p>{{ community.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="seguranca" ref="safetySection" class="section-band safety-section">
        <div class="safety-copy">
          <p class="eyebrow">Segurança</p>
          <h2>Conexão sim. Assédio não.</h2>
          <p>O Mimi foi pensado para permitir expressão sem abrir espaço para invasão, fetichização ou pressão.</p>
          <div class="culture-note">Admirar é permitido. Fetichizar e assediar não.</div>
        </div>

        <div class="safety-grid">
          <article v-for="item in safetyCards" :key="item.title">
            <span></span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="lista-de-espera" class="section-band waitlist-section">
        <div class="waitlist-copy">
          <p class="eyebrow">Lista de espera</p>
          <h2>Quer testar o Mimi antes de todo mundo?</h2>
          <p>
            Entre na lista de espera e ajude a construir uma rede social onde pessoas se descobrem por conteúdo,
            comunidade e afinidade.
          </p>
          <div class="privacy-note">
            Vamos usar seus dados apenas para validar o Mimi e chamar pessoas para o beta. Sem spam.
          </div>
        </div>

        <form class="waitlist-form" @submit.prevent="handleStepSubmit" @focusin="handleFormStarted">
          <div class="form-top">
            <div>
              <span>Passo {{ currentStep }} de {{ totalSteps }}</span>
              <h3>{{ currentStepMeta.title }}</h3>
              <p>{{ currentStepMeta.text }}</p>
            </div>
            <div class="step-counter" aria-hidden="true">
              <span
                v-for="step in formSteps"
                :key="step.number"
                :class="{ active: step.number <= currentStep }"
              ></span>
            </div>
          </div>

          <div v-show="currentStep === 1" class="form-step">
            <div class="form-grid">
              <label>
                <span>Nome ou apelido *</span>
                <input v-model="form.name" name="name" type="text" autocomplete="name" placeholder="Como quer aparecer?" />
              </label>

              <label>
                <span>E-mail *</span>
                <input v-model="form.email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" />
              </label>

              <label>
                <span>Idade *</span>
                <input v-model="form.age" name="age" type="number" inputmode="numeric" placeholder="18+" />
              </label>

              <label>
                <span>Cidade/estado *</span>
                <input v-model="form.cityState" name="cityState" type="text" placeholder="São Paulo, SP" />
              </label>
            </div>
          </div>

          <div v-show="currentStep === 2" class="form-step">
            <label>
              <span>Como você se identifica? *</span>
              <select v-model="form.identity" name="identity">
                <option value="">Selecione uma opção</option>
                <option v-for="option in identityOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label v-if="showCustomIdentity">
              <span>Prefere escrever?</span>
              <input v-model="form.customIdentity" name="customIdentity" type="text" placeholder="Escreva do seu jeito" />
            </label>

            <fieldset>
              <legend>O que você gostaria de encontrar no Mimi? *</legend>
              <div class="option-grid">
                <label v-for="option in lookingForOptions" :key="option" class="check-pill">
                  <input v-model="form.lookingFor" type="checkbox" :value="option" />
                  <span>{{ option }}</span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Quem você gostaria de conhecer? *</legend>
              <div class="option-grid">
                <label v-for="option in wantsToMeetOptions" :key="option" class="check-pill">
                  <input v-model="form.wantsToMeet" type="checkbox" :value="option" />
                  <span>{{ option }}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div v-show="currentStep === 3" class="form-step">
            <fieldset>
              <legend>Você toparia participar do beta fechado? *</legend>
              <div class="option-row">
                <label v-for="option in betaOptions" :key="option" class="radio-pill">
                  <input v-model="form.betaInterest" type="radio" name="betaInterest" :value="option" />
                  <span>{{ option }}</span>
                </label>
              </div>
            </fieldset>

            <label>
              <span>Instagram, Discord ou outro contato</span>
              <input v-model="form.contactHandle" name="contactHandle" type="text" placeholder="@usuario ou discord" />
            </label>

            <label>
              <span>O que mais te incomoda nos apps/redes atuais?</span>
              <textarea v-model="form.biggestPain" name="biggestPain" rows="3" placeholder="Conte se quiser"></textarea>
            </label>

            <label>
              <span>Comentário livre</span>
              <textarea v-model="form.comment" name="comment" rows="3" placeholder="Algo que o Mimi deveria saber?"></textarea>
            </label>
          </div>

          <p v-if="errorMessage" class="form-message error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="form-message success">{{ successMessage }}</p>

          <div class="form-actions">
            <button v-if="currentStep > 1" class="button button-ghost" type="button" @click="goToPreviousStep">
              Voltar
            </button>
            <button class="button button-primary submit-button" type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting">Enviando...</span>
              <span v-else-if="currentStep < totalSteps">Continuar</span>
              <span v-else>Entrar no beta</span>
            </button>
          </div>
        </form>
      </section>
    </main>

    <main v-else-if="currentPage.startsWith('admin')" class="admin-page">
      <section v-if="currentPage === 'admin-register'" class="admin-auth-shell">
        <button class="back-link" type="button" @click="setPage('home')">Voltar para o Mimi</button>
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Criar acesso</h1>
          <p class="legal-intro">
            Cadastre seu e-mail e senha. O acesso ao dashboard só abre depois que `admin = 1` for ativado no banco.
          </p>
        </div>

        <form class="admin-form" @submit.prevent="handleAdminRegister">
          <label>
            <span>Nome *</span>
            <input v-model="adminRegisterForm.name" type="text" autocomplete="name" placeholder="Seu nome" />
          </label>
          <label>
            <span>E-mail *</span>
            <input v-model="adminRegisterForm.email" type="email" autocomplete="email" placeholder="voce@email.com" />
          </label>
          <label>
            <span>Senha *</span>
            <input v-model="adminRegisterForm.password" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
          </label>

          <p v-if="adminError" class="form-message error">{{ adminError }}</p>
          <p v-if="adminSuccess" class="form-message success">{{ adminSuccess }}</p>

          <button class="button button-primary" type="submit" :disabled="adminRegisterSubmitting">
            {{ adminRegisterSubmitting ? 'Criando...' : 'Criar usuário' }}
          </button>
          <button class="button button-ghost" type="button" @click="setPage('admin-login')">Já tenho acesso</button>
        </form>
      </section>

      <section v-else-if="currentPage === 'admin-login'" class="admin-auth-shell">
        <button class="back-link" type="button" @click="setPage('home')">Voltar para o Mimi</button>
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Entrar</h1>
          <p class="legal-intro">Acesse o painel para ver contatos do site e inscrições do beta.</p>
        </div>

        <form class="admin-form" @submit.prevent="handleAdminLogin">
          <label>
            <span>E-mail *</span>
            <input v-model="adminLoginForm.email" type="email" autocomplete="email" placeholder="voce@email.com" />
          </label>
          <label>
            <span>Senha *</span>
            <input v-model="adminLoginForm.password" type="password" autocomplete="current-password" placeholder="Sua senha" />
          </label>

          <p v-if="adminError" class="form-message error">{{ adminError }}</p>

          <button class="button button-primary" type="submit" :disabled="adminLoginSubmitting">
            {{ adminLoginSubmitting ? 'Entrando...' : 'Entrar no admin' }}
          </button>
          <button class="button button-ghost" type="button" @click="setPage('admin-register')">Criar usuário</button>
        </form>
      </section>

      <section v-else class="admin-dashboard">
        <div class="admin-dashboard-top">
          <div>
            <p class="eyebrow">Admin</p>
            <h1>Dashboard</h1>
            <p class="legal-intro">Contatos recebidos pelo site e inscrições na lista beta.</p>
          </div>
          <div class="admin-actions">
            <button class="button button-ghost" type="button" @click="loadAdminDashboard">Atualizar</button>
            <button class="button button-primary" type="button" @click="handleAdminLogout">Sair</button>
          </div>
        </div>

        <div v-if="!adminToken" class="admin-empty">
          <p class="form-message error">Faça login como admin para acessar esta área.</p>
          <button class="button button-primary" type="button" @click="setPage('admin-login')">Ir para login</button>
        </div>

        <template v-else>
          <p v-if="adminError" class="form-message error">{{ adminError }}</p>
          <p v-if="adminLoading" class="admin-loading">Carregando dashboard...</p>

          <div v-if="adminDashboard" class="admin-stats">
            <article>
              <span>Contatos</span>
              <strong>{{ adminDashboard.stats.contactCount }}</strong>
            </article>
            <article>
              <span>Inscrições beta</span>
              <strong>{{ adminDashboard.stats.waitlistCount }}</strong>
            </article>
          </div>

          <div v-if="adminDashboard" class="admin-data-grid">
            <section class="admin-panel">
              <header>
                <h2>Contatos do site</h2>
                <span>{{ adminDashboard.contacts.length }} recentes</span>
              </header>
              <div class="admin-list">
                <article v-for="contact in adminDashboard.contacts" :key="contact.id" class="admin-record">
                  <div>
                    <strong>{{ contact.name }}</strong>
                    <span>{{ contact.email }} · {{ formatDateTime(contact.createdAt) }}</span>
                  </div>
                  <h3>{{ contact.subject }}</h3>
                  <p>{{ contact.message }}</p>
                </article>
              </div>
            </section>

            <section class="admin-panel">
              <header>
                <h2>Lista beta</h2>
                <span>{{ adminDashboard.waitlist.length }} recentes</span>
              </header>
              <div class="admin-list">
                <article v-for="lead in adminDashboard.waitlist" :key="lead.id" class="admin-record">
                  <div>
                    <strong>{{ lead.name }} · {{ lead.age }}</strong>
                    <span>{{ lead.email }} · {{ formatDateTime(lead.createdAt) }}</span>
                  </div>
                  <dl>
                    <div><dt>Cidade</dt><dd>{{ lead.cityState }}</dd></div>
                    <div><dt>Identidade</dt><dd>{{ lead.identity }}</dd></div>
                    <div><dt>Busca</dt><dd>{{ formatListValue(lead.lookingFor) }}</dd></div>
                    <div><dt>Conhecer</dt><dd>{{ formatListValue(lead.wantsToMeet) }}</dd></div>
                    <div><dt>Beta</dt><dd>{{ lead.betaInterest }}</dd></div>
                  </dl>
                  <p v-if="lead.biggestPain">{{ lead.biggestPain }}</p>
                  <p v-if="lead.comment">{{ lead.comment }}</p>
                </article>
              </div>
            </section>
          </div>
        </template>
      </section>
    </main>

    <main v-else class="legal-page">
      <section v-if="currentLegalPage" class="legal-shell">
        <button class="back-link" type="button" @click="setPage('home')">Voltar para o Mimi</button>
        <p class="eyebrow">{{ currentLegalPage.eyebrow }}</p>
        <h1>{{ currentLegalPage.title }}</h1>
        <p class="legal-intro">{{ currentLegalPage.intro }}</p>

        <div class="legal-grid">
          <article v-for="section in currentLegalPage.sections" :key="section.title">
            <h2>{{ section.title }}</h2>
            <p>{{ section.text }}</p>
          </article>
        </div>
      </section>

      <section v-else class="legal-shell contact-shell">
        <button class="back-link" type="button" @click="setPage('home')">Voltar para o Mimi</button>
        <div class="contact-copy">
          <p class="eyebrow">Contato</p>
          <h1>Fale com o Mimi</h1>
          <p class="legal-intro">
            Use este canal para dúvidas sobre beta, privacidade, parcerias ou remoção de dados da lista de espera.
          </p>
        </div>

        <form class="contact-form" @submit.prevent="handleContactSubmit">
          <label>
            <span>Nome *</span>
            <input v-model="contactForm.name" type="text" autocomplete="name" placeholder="Como podemos te chamar?" />
          </label>
          <label>
            <span>E-mail *</span>
            <input v-model="contactForm.email" type="email" autocomplete="email" placeholder="voce@email.com" />
          </label>
          <label>
            <span>Assunto *</span>
            <input v-model="contactForm.subject" type="text" placeholder="Sobre o que quer falar?" />
          </label>
          <label>
            <span>Mensagem *</span>
            <textarea v-model="contactForm.message" rows="6" placeholder="Escreva sua mensagem"></textarea>
          </label>

          <p v-if="contactError" class="form-message error">{{ contactError }}</p>
          <p v-if="contactSuccess" class="form-message success">{{ contactSuccess }}</p>

          <button class="button button-primary" type="submit" :disabled="contactSubmitting">
            {{ contactSubmitting ? 'Enviando...' : 'Enviar mensagem' }}
          </button>
        </form>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-brand">
        <span class="brand-mark footer-mark" aria-hidden="true">
          <img :src="iconColored" alt="" />
        </span>
        <strong>Mimi</strong>
        <p>Menos swipe. Mais presença.</p>
      </div>
      <nav aria-label="Links de rodapé">
        <a href="/termos" @click.prevent="setPage('termos')">Termos</a>
        <a href="/privacidade" @click.prevent="setPage('privacidade')">Privacidade</a>
        <a href="/contato" @click.prevent="setPage('contato')">Contato</a>
      </nav>
      <p>Mimi está em fase de validação. Ainda não é uma plataforma aberta ao público.</p>
    </footer>

  </div>
</template>
