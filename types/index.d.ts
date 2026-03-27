import { ComponentPropsWithoutRef, ElementType } from "react";

export type CustomElementType<E extends ElementType, T = any> = {
  as?: E;
  className?: string;
  children?: React.ReactNode | ((loading: boolean, error: any, data: T | null) => React.ReactNode);
  delay?: number;
  onLoadStart?(element: HTMLElement): void;
  onComplete?(element: HTMLElement): void;
  onError?(element: HTMLElement, error: any): void;
} & Omit<ComponentPropsWithoutRef<E>, 'children' | 'onLoading'>;

export interface ElegantComponentProps {
  resource: string;
  wheres?: WhereClause[];
  orders?: OrderClause[];
  limit?: number;
  offset?: number;
  id?: string;
}

export interface Config {
  baseURL: string; 
  timeout: number;
  cache: RequestCache;
  bridge_public_key: string;
}

export interface WhereClause {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
  value: any;
  boolean?: 'and' | 'or';
}

export type RequestData = {
    method: "GET" | "POST" | "PATCH" | "DELETE",
    body?: BodyInit | null | undefined
}

export interface OrderClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface JoinClause {
  resource: string;
  type: "left" | "right" | "cross" | "inner";
  fkey?: string;
  okey?: string;
}
