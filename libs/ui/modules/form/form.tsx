import type { AnyFormState } from '@tanstack/react-form';
import { createFormHook, createFormHookContexts, useForm, useStore } from '@tanstack/react-form';
import {
  type ComponentType,
  createContext,
  type FormEventHandler,
  type ReactNode,
  useContext,
} from 'react';
import * as v from 'valibot';
import { cn } from '../../helpers/utils';

export { useForm, useStore, v };

type FieldValidators = Record<string, unknown>;

type AppFormWrapperProps = {
  form: {
    AppForm: ComponentType<{ children?: ReactNode }>;
    handleSubmit: () => void;
  };
  schema?: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>;
  validators?: Record<string, FieldValidators>;
  className?: string;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

type FormSubmitProps = {
  form: {
    Subscribe: ComponentType<{
      selector: (state: AnyFormState) => boolean;
      children: (isSubmitting: boolean) => ReactNode;
    }>;
  };
  children: (isSubmitting: boolean) => ReactNode;
};

const formValidatorsContext = createContext<Record<string, FieldValidators> | undefined>(undefined);

export function useFormValidatorsContext() {
  return useContext(formValidatorsContext);
}

export function createValibotFieldValidators(
  schema: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>,
) {
  const validateWith = (schemaRule: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>) => {
    return ({ value }: { value: unknown }) => {
      const result = v.safeParse(schemaRule, value);
      return result.success ? undefined : result.issues[0]?.message;
    };
  };

  return Object.fromEntries(
    Object.entries(schema).map(([name, schemaRule]) => [
      name,
      {
        onChange: validateWith(schemaRule),
        onSubmit: validateWith(schemaRule),
      },
    ]),
  );
}

/** @deprecated Use createValibotFieldValidators instead */
export const createZodFieldValidators = createValibotFieldValidators;

export function Form({
  form,
  schema,
  validators,
  className,
  children,
  onSubmit,
}: AppFormWrapperProps) {
  const resolvedValidators =
    validators ?? (schema ? createValibotFieldValidators(schema) : undefined);

  return (
    <formValidatorsContext.Provider value={resolvedValidators}>
      <form.AppForm>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
            onSubmit?.(e);
          }}
          className={cn(className)}
        >
          {children}
        </form>
      </form.AppForm>
    </formValidatorsContext.Provider>
  );
}

export function FormSubmit({ form, children }: FormSubmitProps) {
  return <form.Subscribe selector={(state) => state.isSubmitting}>{children}</form.Subscribe>;
}

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
