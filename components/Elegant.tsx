import React, { ComponentPropsWithRef, ElementType, forwardRef, useEffect, useRef, useState } from "react";
import { DriftQL } from "driftql-react";
import { QueryBuilder } from "../bin";

const DEFAULT_WHERES: any[] = [];
const DEFAULT_ORDERS: any[] = [];

const Elegant = forwardRef((
  { as: Component = 'div' as const, className, children, wheres, orders, limit, offset = 0, resource, id, delay = 0, onLoadStart, onComplete, onError, ...rest }: DriftQL.CustomElementType<'div'> & DriftQL.ElegantComponentProps,
  ref: React.Ref<any>
) => {
  const internalRef = useRef<HTMLElement>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const effectiveWheres = wheres ?? DEFAULT_WHERES;
  const effectiveOrders = orders ?? DEFAULT_ORDERS;
  
  useEffect(() => {

    setLoading(true);

    if (internalRef.current && onLoadStart) {
      onLoadStart(internalRef.current);
    }

    setTimeout(async () => {
      try {
        let builder = new QueryBuilder(resource ?? '');

        for (const condition of effectiveWheres) {
          builder = builder.where(condition);
        }

        for (const order of effectiveOrders) {
          builder = builder.orderBy(order['column'], order['direction'] ?? 'ASC');
        }

        if (id) {
          builder.getById(id);
        }

        if (limit) {
          builder = builder.limit(offset ?? 0, limit);
        }

        const result = await builder.get();
        const data = result.length ? result[0] : null;

        setResponse(data);
        
        if (internalRef.current && data) {
          
          for (const prop in rest) {
            if (!prop.startsWith('data-')) continue;

            const attribute = prop.substring(5);
            const keyToFetch = (rest as Record<string, any>)[prop];

              if (keyToFetch && (data as Record<string, any>)[keyToFetch] !== undefined) {
                (internalRef.current as HTMLElement).setAttribute(attribute, (data as Record<string, any>)[keyToFetch]);
                (internalRef.current as HTMLElement).removeAttribute(prop);
              }
          }
        }
      } catch (error) {
        setError(error);

        if (internalRef.current && onError) {
          onError(internalRef.current, error);
        }
      } finally {
        setLoading(false);

        if (internalRef.current && onComplete) {
          onComplete(internalRef.current);
        }
      }
    }, delay);
  }, [resource, effectiveOrders, effectiveWheres, id, limit, delay]);

  const setRefs = (node: any) => {
    
    internalRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<any>).current = node;
    }
  };

  const content = typeof children === 'function' ? children(loading, error, response): children;

  return (
    <Component ref={setRefs} className={className} {...rest}>
      {content}
    </Component>
  );
}) as <E extends ElementType = 'div'>(
  props: DriftQL.CustomElementType<E> & { ref?: ComponentPropsWithRef<E>['ref'] } & DriftQL.ElegantComponentProps
) => React.ReactElement | null;

export default Elegant;