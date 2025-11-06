import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: any, value: any) => {
  try {
    return await AsyncStorage.setItem(key, value);
  } catch (error) {}
};

export const getData = async (key: any) => {
  try {
    let data = await AsyncStorage.getItem(key);
    return key !== null ? data : null;
  } catch (error) {}
};

export const removeItemValue = async (key: any) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (exception) {
    return false;
  }
};

export const storeDataJson = async (key: any, value: any) => {
  try {
    let data = await AsyncStorage.getItem(key);
    const parsedData = data !== null ? JSON.parse(data) : null;
    const jsonValue = JSON.stringify({ ...parsedData, ...value });
    await AsyncStorage.setItem(key, jsonValue);
  } catch (err) {}
};
export const getDataJson = async (key: any) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (err) {}
};

export const isLogin = async () => {
  try {
    await getData('token').then(res => {
      if (!res) {
        return false;
      } else {
        return true;
      }
    });
  } catch {}
};

module.exports = {
  storeData,
  getData,
  removeItemValue,
  storeDataJson,
  getDataJson,
};
