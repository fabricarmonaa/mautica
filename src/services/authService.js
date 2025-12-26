export const authState = {
  token: null,
  role: null,
  tenantId: null
};

export const setAuth = (data) => {
  authState.token = data.token;
  authState.role = data.role;
  authState.tenantId = data.tenantId;
};

export const clearAuth = () => {
  authState.token = null;
  authState.role = null;
  authState.tenantId = null;
};
