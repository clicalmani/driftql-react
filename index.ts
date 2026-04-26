import { Config, JoinClause, OrderClause, WhereClause } from './types';
import { request } from './xhr';

let appConfig: Config = {
  baseURL: '/api/bridge',
  timeout: 5000,
  cache: 'default',
  bridge_public_key: ''
};

export class QueryBuilder<T> {
  protected modelName: string;
  protected wheres: WhereClause[] = [];
  protected havings: WhereClause[] = [];
  protected orders: OrderClause[] = [];
  protected groups: OrderClause[] = [];
  protected joins: JoinClause[] = [];
  protected limitVal: number | null = null;
  protected offsetVal: number = 0;
  protected byId: boolean = false;
  protected id: number | string = '';
  protected distinct_rows: boolean = false;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  where(condition: WhereClause): this {
    condition.boolean = condition?.boolean ?? 'and';
    this.wheres.push(condition);
    return this;
  }

  having(condition: WhereClause): this {
    condition.boolean = condition?.boolean ?? 'and';
    this.havings.push(condition);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orders.push({ column, direction });
    return this;
  }

  groupBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.groups.push({ column, direction });
    return this;
  }

  limit(offset: number, count?: number): this {
    if (count !== undefined) {
      this.offsetVal = offset;
      this.limitVal = count;
    } else {
      this.limitVal = offset;
    }
    return this;
  }

  top(count: number): this {
    this.offsetVal = 0;
    this.limitVal = count;
    return this;
  }

  join(clause: JoinClause): this {
    clause.type = clause?.type ?? 'left';
    this.joins.push(clause);
    return this;
  }

  distinct(active: boolean = false): this {
    this.distinct_rows = active;
    return this;
  }

  getById(id: number | string): this {
    this.byId = true;
    this.id = id;
    return this;
  }

  async get(): Promise<T[]> {
    return this.execute();
  }
  
  async first(): Promise<T | null> {
    const results = await this.limit(0, 1).get();
    return results.length > 0 ? results[0] : null;
  }

  async paginate(page: number = 1, perPage: number = 15): Promise<any> {
    const offset = (page - 1) * perPage;
    this.limit(offset, perPage);
    return this.execute();
  }

  async all(): Promise<T[]> {
    return this.execute();
  }

  async store(data: FormData): Promise<T> {
    const hash = await this.hashString('store');

    data.append('__dq_model', this.modelName);

    try {
      const controller = new AbortController;
      const timer = setTimeout(() => controller.abort(), appConfig.timeout)
      const response = await request(appConfig.baseURL + '/' + appConfig.bridge_public_key + '/' + hash, () => ({
        method: data.get('__dq_id') ? 'PATCH' : 'POST',
        body: data,
        signal: controller.signal
      }));
      clearTimeout(timer);
      return response;
    } catch (error) {
      console.error(`Error on ${this.modelName}:`, error);
      throw error;
    }
  }

  async update(id: any, data: FormData): Promise<T> {
    const hash = await this.hashString('update');
    data.append('__dq_id', id);
    return await this.store(data);
  }

  async delete(id: any): Promise<boolean> {
    const hash = await this.hashString('delete');

    try {
      const controller = new AbortController;
      const timer = setTimeout(() => controller.abort(), appConfig.timeout)
      const { success } = await request(appConfig.baseURL + '/' + appConfig.bridge_public_key + '/' + hash + '?__dq_id=' + id + '&__dq_model=' + this.modelName, () => ({
        method: 'DELETE',
        signal: controller.signal
      }));
      clearTimeout(timer);
      return success;
    } catch (error) {
      console.error(`Error on ${this.modelName}:`, error);
      throw error;
    }
  }

  async verifyPassword(id: string, field: string, value: string): Promise<boolean> {
    const hash = await this.hashString('verify_password');
    const data = new FormData();

    data.append('__dq_model', this.modelName);
    data.append('__dq_vfp_field', field);
    data.append('__dq_vfp_value', value);
    data.append('__dq_id', id);

    try {
      const controller = new AbortController;
      const timer = setTimeout(() => controller.abort(), appConfig.timeout)
      const { valid } = await request(appConfig.baseURL + '/' + appConfig.bridge_public_key + '/' + hash, () => ({
        method: 'POST',
        body: data,
        signal: controller.signal
      }));
      clearTimeout(timer);
      return valid;
    } catch (error) {
      console.error(`Error verifying password:`, error);
      throw error;
    }
  }

  private async execute(): Promise<any> {
    const data = new FormData();

    data.append('__dq_model', this.modelName);
    // Base 64 encode the joins
    // data.append('__dq_joins', btoa(JSON.stringify(this.joins)));
    data.append('__dq_distinct', this.distinct_rows ? '1': '0');
    data.append('__dq_query', JSON.stringify({
      wheres: this.wheres,
      havings: this.havings,
      orders: this.orders,
      groups: this.groups,
      joins: this.joins,
      limit: this.limitVal,
      offset: this.offsetVal,
    }));

    if (this.byId) {
      data.append('__dq_by_id', '1');
      data.append('__dq_id', this.id as string);
    }

    try {
      const controller = new AbortController;
      const timer = setTimeout(() => controller.abort(), appConfig.timeout)
      const response = await request(appConfig.baseURL + '/' + appConfig.bridge_public_key, () => ({
        method: 'POST',
        body: data,
        signal: controller.signal
      }));
      clearTimeout(timer);
      return response;
    } catch (error) {
      console.error(`Error on ${this.modelName}:`, error);
      throw error;
    }
  }

  private async hashString(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

export abstract class Elegant {
  
  protected static resourceName: string;

  static async find<T extends Elegant>(id: number | string, column: string = 'id'): Promise<T | null> {
    const builder = new QueryBuilder<T>(this.resourceName);
    builder.where({column, operator: '=', value: id, boolean: 'and'});
    return builder.first();
  }

  static async all<T extends Elegant>(): Promise<T[]> {
    const builder = new QueryBuilder<T>(this.resourceName);
    return builder.all();
  }

  static async store<T extends Elegant>(form_data: FormData): Promise<T | null> {
    const builder = new QueryBuilder(this.resourceName);
    const response = await builder.store(form_data);
    const { success, data } = response as any;
    if (success) {
      const instance = new (this as any)() as T;
      return Object.assign(instance, data);
    }
    return null;
  }

  static async update<T extends Elegant>(id: any, form_data: FormData): Promise<T | null> {
    const builder = new QueryBuilder(this.resourceName);
    const response = await builder.update(id, form_data);
    const { success, data } = response as any;
    if (success) {
      const instance = new (this as any)() as T;
      return Object.assign(instance, data);
    }
    return null;
  }

  static async delete<T extends Elegant>(id: any): Promise<boolean> {
    const builder = new QueryBuilder(this.resourceName);
    return await builder.delete(id);
  }

  static where<T extends Elegant>(condition: WhereClause): QueryBuilder<T> {
    const builder = new QueryBuilder<T>(this.resourceName);
    return builder.where(condition);
  }

  static having<T extends Elegant>(condition: WhereClause): QueryBuilder<T> {
    const builder = new QueryBuilder<T>(this.resourceName);
    return builder.having(condition);
  }

  static async verifyPassword(id: string, field: string, value: string): Promise<boolean> {
    const builder = new QueryBuilder(this.resourceName);
    return await builder.verifyPassword(id, field, value);
  }
}

export const Client = {
  init: (config: Partial<Config>) => {
    appConfig = { ...appConfig, ...config };
  }
};