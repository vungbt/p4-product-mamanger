import type { AnyFieldApi } from '@tanstack/react-form';
import {
  type ChangeEvent,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';
import { fieldContext, useFormContext, useFormValidatorsContext } from './form';
import { FormErrorMessage } from './form-error-message';
import { FormLabel } from './form-label';

type FieldValidators =
  NonNullable<AnyFieldApi['options']> extends never
    ? Record<string, unknown>
    : // TanStack Form field validators shape (loose for cross-version)
      Record<string, unknown>;

type FormFieldProps = {
  field?: AnyFieldApi;
  name?: string;
  validators?: FieldValidators;
  label?: string;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  mapValue?: (value: AnyFieldApi['state']['value']) => AnyFieldApi['state']['value'];
  mapOnChange?: (value: AnyFieldApi['state']['value']) => AnyFieldApi['state']['value'];
  children: ReactNode | ReactElement<Record<string, unknown>> | ((field: AnyFieldApi) => ReactNode);
};

type FormFieldContentProps = {
  field: AnyFieldApi;
  label?: string;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  mapValue?: (value: AnyFieldApi['state']['value']) => AnyFieldApi['state']['value'];
  mapOnChange?: (value: AnyFieldApi['state']['value']) => AnyFieldApi['state']['value'];
  children: ReactNode | ReactElement<Record<string, unknown>> | ((field: AnyFieldApi) => ReactNode);
};

function FormFieldContent({
  field,
  label,
  required,
  size,
  className,
  mapValue,
  mapOnChange,
  children,
}: FormFieldContentProps) {
  const hasSubmitted = field.form.state.submissionAttempts > 0;
  const error =
    (field.state.meta.isTouched || hasSubmitted) && field.state.meta.errors.length > 0
      ? String(field.state.meta.errors[0])
      : undefined;

  const shouldRenderExternalError = () => {
    if (typeof children === 'function' || !isValidElement(children)) {
      return true;
    }

    const childType = children.type as { displayName?: string; name?: string };
    const childName = childType.displayName ?? childType.name;

    const selfHandledErrors = [
      'Input',
      'InputPassword',
      'Textarea',
      'DatePicker',
      'TimePicker',
      'DateRangePicker',
    ];
    return !selfHandledErrors.includes(childName ?? '');
  };

  const resolveChangedValue = (
    value: AnyFieldApi['state']['value'] | ChangeEvent<HTMLInputElement>,
  ) => {
    if (value !== null && typeof value === 'object' && 'target' in value) {
      // `checked` exists on all HTMLInputElements via the prototype; only checkboxes use it for value.
      const t = value.target as HTMLInputElement;
      if (t.type === 'checkbox') {
        return t.checked;
      }
      return t.value;
    }

    return value;
  };

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(field);
    }

    if (!isValidElement(children)) {
      return children;
    }

    const childElement = children as ReactElement<Record<string, unknown>>;
    const childProps = childElement.props ?? {};

    const currentValue = mapValue ? mapValue(field.state.value) : field.state.value;

    return cloneElement(childElement, {
      ...childProps,
      id: field.name,
      name: field.name,
      size,
      required,
      error,
      onChange: (value: AnyFieldApi['state']['value'] | ChangeEvent<HTMLInputElement>) => {
        (childProps.onChange as ((v: typeof value) => void) | undefined)?.(value);
        const mappedValue = mapOnChange
          ? mapOnChange(value as AnyFieldApi['state']['value'])
          : resolveChangedValue(value);

        if (mappedValue === undefined) {
          field.handleChange('' as never);
          return;
        }

        field.handleChange(mappedValue);
      },
      onBlur: (value: AnyFieldApi['state']['value']) => {
        (childProps.onBlur as ((v: typeof value) => void) | undefined)?.(value);
        field.handleBlur();
      },
      ...(typeof currentValue === 'boolean' ? { checked: currentValue } : { value: currentValue }),
    });
  };

  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <FormLabel id={field.name} size={size} required={required}>
          {label}
        </FormLabel>
      )}

      <fieldContext.Provider value={field as never}>{renderChildren()}</fieldContext.Provider>

      {error && shouldRenderExternalError() && <FormErrorMessage error={error} size={size} />}
    </div>
  );
}

function FormFieldByName({
  name,
  validators,
  ...props
}: Omit<FormFieldProps, 'field'> & { name: string }) {
  const form = useFormContext();
  const formValidators = useFormValidatorsContext();
  const resolvedValidators = validators ?? formValidators?.[name];

  return (
    <form.Field name={name as never} validators={resolvedValidators}>
      {(field) => <FormFieldContent field={field as unknown as AnyFieldApi} {...props} />}
    </form.Field>
  );
}

export function FormField(props: FormFieldProps) {
  if (props.field) {
    const { field, ...rest } = props;
    return <FormFieldContent field={field} {...rest} />;
  }

  if (props.name) {
    return <FormFieldByName {...props} name={props.name} />;
  }

  throw new Error('`FormField` requires either `field` or `name`.');
}
