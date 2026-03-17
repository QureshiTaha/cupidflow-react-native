import {ToastProvider, useToast} from 'react-native-toast-notifications';

export const AppToastProvider = ({children, ...overrides}) => (
  <ToastProvider
    placement="top"
    offset={16}
    duration={2500}
    swipeEnabled
    animationType="slide-in"
    {...overrides}>
    {children}
  </ToastProvider>
);

export function useAppToast() {
  const toast = useToast();

  const show = (message, opts = {}) => toast.show(message, {...opts});
  const success = (message, opts = {}) => toast.show(message, {type: 'success', ...opts});
  const error = (message, opts = {}) => toast.show(message, {type: 'danger', ...opts});
  const info = (message, opts = {}) => toast.show(message, {type: 'normal', ...opts});
  const warning = (message, opts = {}) => toast.show(message, {type: 'warning', ...opts});

  // Persistent loading toast; returns helpers to update/hide it
  const loading = (message = 'Working…', opts = {}) => {
    const id = toast.show(message, {duration: 0, type: 'normal', ...opts});
    return {
      id,
      success: (msg = 'Done!', sOpts = {}) => {
        if (typeof toast.update === 'function') {
          toast.update(id, msg, {type: 'success', duration: 2000, ...sOpts});
        } else {
          toast.hide(id);
          toast.show(msg, {type: 'success', duration: 2000, ...sOpts});
        }
      },
      error: (msg = 'Something went wrong', eOpts = {}) => {
        if (typeof toast.update === 'function') {
          toast.update(id, msg, {type: 'danger', duration: 2500, ...eOpts});
        } else {
          toast.hide(id);
          toast.show(msg, {type: 'danger', duration: 2500, ...eOpts});
        }
      },
      update: (msg, uOpts = {}) => {
        if (typeof toast.update === 'function') {
          toast.update(id, msg, {duration: 0, ...uOpts});
        } else {
          toast.hide(id);
          toast.show(msg, {duration: 0, ...uOpts});
        }
      },
      hide: () => toast.hide(id),
    };
  };

  const withLoading = async (promise, messages = {}) => {
    const ctl = loading(messages.loading || 'Please wait…');
    try {
      const res = await promise;
      ctl.success(messages.success || 'All set!');
      return res;
    } catch (e) {
      ctl.error(messages.error || 'Failed, try again.');
      throw e;
    }
  };

  const offline = (msg = 'You’re offline. Check your connection.') =>
    toast.show(msg, {type: 'warning', duration: 3000});

  return {
    raw: toast,
    show,
    success,
    error,
    info,
    warning,
    loading,
    withLoading,
    offline,
  };
}