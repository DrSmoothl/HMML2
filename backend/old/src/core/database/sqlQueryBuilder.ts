/**
 * SQL查询构建器
 * 用于动态构建各种SQL查询语句
 */

import { 
  QueryFilter, 
  SortParams, 
  FilterOperator 
} from '../../types/database';
import { ValidationError } from '../../middleware/errorHandler';

export class SqlQueryBuilder {
  private tableName: string;
  private queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  private selectFields: string[] = [];
  private insertFields: Record<string, any> = {};
  private updateFields: Record<string, any> = {};
  private whereConditions: QueryFilter[] = [];
  private orderByFields: SortParams[] = [];
  private groupByFields: string[] = [];
  private havingConditions: QueryFilter[] = [];
  private limitCount?: number;
  private offsetCount?: number;

  constructor(table: string, type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') {
    this.tableName = table;
    this.queryType = type;
  }

  /**
   * 创建SELECT查询构建器
   */
  public static select(table: string): SqlQueryBuilder {
    return new SqlQueryBuilder(table, 'SELECT');
  }

  /**
   * 创建INSERT查询构建器
   */
  public static insert(table: string): SqlQueryBuilder {
    return new SqlQueryBuilder(table, 'INSERT');
  }

  /**
   * 创建UPDATE查询构建器
   */
  public static update(table: string): SqlQueryBuilder {
    return new SqlQueryBuilder(table, 'UPDATE');
  }

  /**
   * 创建DELETE查询构建器
   */
  public static delete(table: string): SqlQueryBuilder {
    return new SqlQueryBuilder(table, 'DELETE');
  }

  /**
   * 设置查询字段
   */
  public fields(fields: string[] | Record<string, any>): SqlQueryBuilder {
    if (this.queryType === 'SELECT') {
      this.selectFields = Array.isArray(fields) ? fields : ['*'];
    } else if (this.queryType === 'INSERT') {
      this.insertFields = Array.isArray(fields) ? {} : fields;
    } else if (this.queryType === 'UPDATE') {
      this.updateFields = Array.isArray(fields) ? {} : fields;
    }
    return this;
  }

  /**
   * 设置WHERE条件
   */
  public where(conditions: QueryFilter[]): SqlQueryBuilder {
    this.whereConditions = conditions;
    return this;
  }

  /**
   * 设置ORDER BY排序
   */
  public orderBy(orderBy: SortParams[]): SqlQueryBuilder {
    this.orderByFields = orderBy;
    return this;
  }

  /**
   * 设置GROUP BY分组
   */
  public groupBy(groupBy: string[]): SqlQueryBuilder {
    this.groupByFields = groupBy;
    return this;
  }

  /**
   * 设置HAVING条件
   */
  public having(conditions: QueryFilter[]): SqlQueryBuilder {
    this.havingConditions = conditions;
    return this;
  }

  /**
   * 设置LIMIT限制
   */
  public limit(limit: number): SqlQueryBuilder {
    this.limitCount = limit;
    return this;
  }

  /**
   * 设置OFFSET偏移
   */
  public offset(offset: number): SqlQueryBuilder {
    this.offsetCount = offset;
    return this;
  }

  /**
   * 构建SQL语句和参数绑定
   */
  public build(): { sql: string; bindings: any[] } {
    const bindings: any[] = [];
    let sql = '';

    switch (this.queryType) {
      case 'SELECT':
        sql = this.buildSelectQuery(bindings);
        break;
      case 'INSERT':
        sql = this.buildInsertQuery(bindings);
        break;
      case 'UPDATE':
        sql = this.buildUpdateQuery(bindings);
        break;
      case 'DELETE':
        sql = this.buildDeleteQuery(bindings);
        break;
    }

    return { sql, bindings };
  }

  /**
   * 构建SELECT查询
   */
  private buildSelectQuery(bindings: any[]): string {
    const fields = this.selectFields.length > 0 ? this.selectFields.join(', ') : '*';
    let sql = `SELECT ${fields} FROM "${this.tableName}"`;

    // WHERE条件
    if (this.whereConditions.length > 0) {
      const whereClause = this.buildWhereClause(this.whereConditions, bindings);
      sql += ` WHERE ${whereClause}`;
    }

    // GROUP BY
    if (this.groupByFields.length > 0) {
      const groupBy = this.groupByFields.map(field => `"${field}"`).join(', ');
      sql += ` GROUP BY ${groupBy}`;
    }

    // HAVING
    if (this.havingConditions.length > 0) {
      const havingClause = this.buildWhereClause(this.havingConditions, bindings);
      sql += ` HAVING ${havingClause}`;
    }

    // ORDER BY
    if (this.orderByFields.length > 0) {
      const orderBy = this.orderByFields
        .map(sort => `"${sort.field}" ${sort.order}`)
        .join(', ');
      sql += ` ORDER BY ${orderBy}`;
    }

    // LIMIT
    if (this.limitCount !== undefined) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    // OFFSET
    if (this.offsetCount !== undefined) {
      sql += ` OFFSET ${this.offsetCount}`;
    }

    return sql;
  }

  /**
   * 构建INSERT查询
   */
  private buildInsertQuery(bindings: any[]): string {
    const fields = Object.keys(this.insertFields);
    const values = Object.values(this.insertFields);

    if (fields.length === 0) {
      throw new ValidationError('INSERT查询必须指定字段和值');
    }

    const fieldsList = fields.map(field => `"${field}"`).join(', ');
    const placeholders = fields.map(() => '?').join(', ');

    bindings.push(...values);

    return `INSERT INTO "${this.tableName}" (${fieldsList}) VALUES (${placeholders})`;
  }

  /**
   * 构建UPDATE查询
   */
  private buildUpdateQuery(bindings: any[]): string {
    const fields = Object.keys(this.updateFields);
    const values = Object.values(this.updateFields);

    if (fields.length === 0) {
      throw new ValidationError('UPDATE查询必须指定要更新的字段');
    }

    const setClause = fields.map(field => `"${field}" = ?`).join(', ');
    bindings.push(...values);

    let sql = `UPDATE "${this.tableName}" SET ${setClause}`;

    // WHERE条件
    if (this.whereConditions.length > 0) {
      const whereClause = this.buildWhereClause(this.whereConditions, bindings);
      sql += ` WHERE ${whereClause}`;
    }

    return sql;
  }

  /**
   * 构建DELETE查询
   */
  private buildDeleteQuery(bindings: any[]): string {
    let sql = `DELETE FROM "${this.tableName}"`;

    // WHERE条件
    if (this.whereConditions.length > 0) {
      const whereClause = this.buildWhereClause(this.whereConditions, bindings);
      sql += ` WHERE ${whereClause}`;
    }

    return sql;
  }

  /**
   * 构建WHERE子句
   */
  private buildWhereClause(conditions: QueryFilter[], bindings: any[]): string {
    if (conditions.length === 0) {
      return '';
    }

    const clauses = conditions.map((condition, index) => {
      let clause = `"${condition.field}" ${condition.operator}`;

      // 处理不同的操作符
      switch (condition.operator) {
        case 'IS NULL':
        case 'IS NOT NULL':
          // 这些操作符不需要值
          break;
        case 'IN':
        case 'NOT IN':
          if (Array.isArray(condition.value)) {
            const placeholders = condition.value.map(() => '?').join(', ');
            clause += ` (${placeholders})`;
            bindings.push(...condition.value);
          } else {
            throw new ValidationError(`${condition.operator} 操作符需要数组类型的值`);
          }
          break;
        case 'BETWEEN':
          if (Array.isArray(condition.value) && condition.value.length === 2) {
            clause += ` ? AND ?`;
            bindings.push(condition.value[0], condition.value[1]);
          } else {
            throw new ValidationError('BETWEEN 操作符需要包含两个元素的数组');
          }
          break;
        default:
          clause += ` ?`;
          bindings.push(condition.value);
          break;
      }

      // 添加逻辑操作符
      if (index > 0) {
        const logicalOperator = condition.logicalOperator || 'AND';
        clause = `${logicalOperator} ${clause}`;
      }

      return clause;
    });

    return clauses.join(' ');
  }
}
