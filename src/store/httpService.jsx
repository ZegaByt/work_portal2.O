import api from "./axios";

// Utility API calls in plain JS
export const getData = (url, config = {}) => {
  return api.get(url, config);
};

export const postData = (url, data, config = {}) => {
  return api.post(url, data, config);
};

export const putData = (url, data, config = {}) => {
  return api.put(url, data, config);
};

export const patchData = (url, data, config = {}) => {
  return api.patch(url, data, config);
};

export const deleteData = (url, config = {}) => {
  return api.delete(url, config);
};