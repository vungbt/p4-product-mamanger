import { Select } from '@itclabs/react-ui';
import { createContext, useContext } from 'react';

export const TenantContractContext = createContext<{
  contracts: { id: string; code: string }[];
  contractId: string;
  selectContract: (id: string) => void;
} | null>(null);

export function TenantContractSelector() {
  const context = useContext(TenantContractContext);

  if (!context || context.contracts.length < 2) return null;

  return (
    <Select
      aria-label="Chọn hợp đồng"
      value={context.contractId}
      onValueChange={(value) => {
        if (value) context.selectContract(value);
      }}
      options={context.contracts.map((contract) => ({ value: contract.id, label: contract.code }))}
    />
  );
}
