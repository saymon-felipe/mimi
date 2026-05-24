import { reactive, ref } from 'vue';
import { fetchAdminDashboard, loginAdmin, logoutAdmin, registerAdmin } from '../services/adminApi';

const adminTokenStorageKey = 'mimi_admin_token';

export function useAdmin({ setPage }) {
  const adminToken = ref(localStorage.getItem(adminTokenStorageKey) || '');
  const adminUser = ref(null);
  const adminDashboard = ref(null);
  const adminLoading = ref(false);
  const adminError = ref('');
  const adminSuccess = ref('');
  const adminLoginForm = reactive({
    email: '',
    password: ''
  });
  const adminRegisterForm = reactive({
    name: '',
    email: '',
    password: ''
  });
  const adminRegisterSubmitting = ref(false);
  const adminLoginSubmitting = ref(false);

  function formatDateTime(value) {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function formatListValue(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value || '—';
  }

  function storeAdminSession(data) {
    adminToken.value = data.token;
    adminUser.value = data.user;
    localStorage.setItem(adminTokenStorageKey, data.token);
  }

  function clearAdminSession() {
    adminToken.value = '';
    adminUser.value = null;
    adminDashboard.value = null;
    localStorage.removeItem(adminTokenStorageKey);
  }

  async function loadAdminDashboard() {
    adminError.value = '';

    if (!adminToken.value) {
      adminError.value = 'Faça login para acessar o dashboard.';
      return;
    }

    adminLoading.value = true;

    try {
      adminDashboard.value = await fetchAdminDashboard(adminToken.value);
    } catch (error) {
      adminError.value = error.message || 'Não foi possível carregar o dashboard.';

      if (error.status === 401 || error.status === 403) {
        clearAdminSession();
      }
    } finally {
      adminLoading.value = false;
    }
  }

  async function handleAdminLogin() {
    adminError.value = '';
    adminSuccess.value = '';

    if (!adminLoginForm.email.trim() || !adminLoginForm.password.trim()) {
      adminError.value = 'Informe e-mail e senha.';
      return;
    }

    adminLoginSubmitting.value = true;

    try {
      const data = await loginAdmin({
        email: adminLoginForm.email,
        password: adminLoginForm.password
      });

      storeAdminSession(data);
      adminLoginForm.password = '';
      setPage('admin');
      await loadAdminDashboard();
    } catch (error) {
      adminError.value = error.message || 'Não foi possível fazer login.';
    } finally {
      adminLoginSubmitting.value = false;
    }
  }

  async function handleAdminRegister() {
    adminError.value = '';
    adminSuccess.value = '';

    if (!adminRegisterForm.name.trim() || !adminRegisterForm.email.trim() || !adminRegisterForm.password.trim()) {
      adminError.value = 'Preencha nome, e-mail e senha.';
      return;
    }

    adminRegisterSubmitting.value = true;

    try {
      await registerAdmin({
        name: adminRegisterForm.name,
        email: adminRegisterForm.email,
        password: adminRegisterForm.password
      });

      adminSuccess.value = 'Usuário criado. Agora altere admin = 1 para esse e-mail no banco e faça login.';
      adminRegisterForm.name = '';
      adminRegisterForm.email = '';
      adminRegisterForm.password = '';
    } catch (error) {
      adminError.value = error.message || 'Não foi possível criar o usuário.';
    } finally {
      adminRegisterSubmitting.value = false;
    }
  }

  async function handleAdminLogout() {
    if (adminToken.value) {
      await logoutAdmin(adminToken.value).catch(() => {});
    }

    clearAdminSession();
    setPage('admin-login');
  }

  return {
    adminToken,
    adminUser,
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
  };
}
