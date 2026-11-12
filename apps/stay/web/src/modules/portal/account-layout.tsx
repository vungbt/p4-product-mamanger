import { PortalSdkProvider } from '@stay/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/libraries/session/auth-provider';
import AppLayout from '../layout/app-layout';
import { TenantContractContext } from './account-contract-selector';
import { getPortalSdk, selectAccountContract } from './portal-sdk';

function ScopedShell({ contractId }: { contractId: string }) {
  const [client] = useState(() => new QueryClient());

  selectAccountContract(contractId);

  return (
    <QueryClientProvider client={client}>
      <PortalSdkProvider sdk={getPortalSdk()}>
        <AppLayout />
      </PortalSdkProvider>
    </QueryClientProvider>
  );
}

/** Separate query caches prevent stale responses crossing a contract switch. */
export default function TenantAccountLayout() {
  const { user } = useAuth();
  const [selected, setSelected] = useState('');

  const contracts = user?.contractIds ?? [];
  const contractId = contracts.includes(selected) ? selected : contracts[0];

  const options = contracts.map((id, index) => ({
    id,
    code:
      user?.occupiedContracts?.find((contract) => contract.id === id)?.code ??
      `Hợp đồng ${index + 1}`,
  }));

  return (
    <TenantContractContext.Provider
      value={{ contracts: options, contractId: contractId ?? '', selectContract: setSelected }}
    >
      <ScopedShell key={contractId ?? ''} contractId={contractId ?? ''} />
    </TenantContractContext.Provider>
  );
}
