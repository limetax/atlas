import { useLocalStorage } from '@/hooks/useLocalStorage';

const SANDBOX_MODE_KEY = 'atlas_sandbox_mode';

export const useSandboxMode = (): [boolean, (value: boolean) => void] => {
  const [isSandboxMode, setSandboxMode] = useLocalStorage<boolean>(SANDBOX_MODE_KEY, false);
  return [isSandboxMode, setSandboxMode];
};
