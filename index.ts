import { Config, JoinClause, OrderClause, WhereClause } from './types/index';
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
  protected orders: OrderClause[] = [];
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

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orders.push({ column, direction });
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

  private async execute(): Promise<any> {
    const data = new FormData();

    data.append('model', this.modelName);
    data.append('joins', JSON.stringify(this.joins));
    data.append('distinct', this.distinct_rows ? '1': '0');
    data.append('query', JSON.stringify({
      wheres: this.wheres,
      orders: this.orders,
      limit: this.limitVal,
      offset: this.offsetVal,
    }));

    if (this.byId) {
      data.append('by_id', '1');
      data.append('id', this.id as string);
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

  static where<T extends Elegant>(condition: WhereClause): QueryBuilder<T> {
    const builder = new QueryBuilder<T>(this.resourceName);
    return builder.where(condition);
  }
}

export const Client = {
  init: (config: Partial<Config>) => {
    appConfig = { ...appConfig, ...config };
  }
};