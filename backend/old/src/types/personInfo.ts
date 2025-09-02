/**
 * PersonInfo表类型定义
 * 用于定义PersonInfo表的数据结构和操作相关的类型
 */

/**
 * PersonInfo表记录结构
 */
export interface PersonInfoRecord {
  id: number;                           // 唯一标识符
  is_known: number;                     // 是否已经认识
  person_id: string;                    // 人物ID
  person_name: string;                  // 人物名称
  name_reason: string;                  // 命名原因
  platform: string;                    // 平台
  user_id: string;                      // 用户ID
  nickname: string;                     // 昵称
  points: string;                       // 对用户的认知点
  know_times: number;                   // 认知次数
  know_since: number;                   // 认知开始时间
  last_know: number;                    // 最后认知时间
  attitude_to_me: string;               // 对自己的态度
  attitude_to_me_confidence: number;    // 对自己的态度的累计权重
  friendly_value: number;               // 友好度
  friendly_value_confidence: number;    // 友好度的累计权重
  rudeness: string;                     // 粗鲁度
  rudeness_confidence: number;          // 粗鲁度的累计权重
  neuroticism: string;                  // 神经质程度
  neuroticism_confidence: number;       // 神经质程度的累计权重
  conscientiousness: string;            // 尽责程度
  conscientiousness_confidence: number; // 尽责程度的累计权重
  likeness: string;                     // 喜爱程度
  likeness_confidence: number;          // 喜爱程度的累计权重
}

/**
 * 插入PersonInfo时的数据结构（不包含id，因为id是自动生成的）
 */
export interface PersonInfoInsertData {
  is_known?: number;                    // 是否已经认识（可选，默认为0）
  person_id: string;                    // 人物ID
  person_name: string;                  // 人物名称
  name_reason?: string;                 // 命名原因（可选）
  platform: string;                    // 平台
  user_id: string;                      // 用户ID
  nickname?: string;                    // 昵称（可选）
  points?: string;                      // 对用户的认知点（可选）
  know_times?: number;                  // 认知次数（可选，默认为0）
  know_since?: number;                  // 认知开始时间（可选，默认为当前时间）
  last_know?: number;                   // 最后认知时间（可选，默认为当前时间）
  attitude_to_me?: string;              // 对自己的态度（可选）
  attitude_to_me_confidence?: number;   // 对自己的态度的累计权重（可选，默认为0）
  friendly_value?: number;              // 友好度（可选，默认为0）
  friendly_value_confidence?: number;   // 友好度的累计权重（可选，默认为0）
  rudeness?: string;                    // 粗鲁度（可选）
  rudeness_confidence?: number;         // 粗鲁度的累计权重（可选，默认为0）
  neuroticism?: string;                 // 神经质程度（可选）
  neuroticism_confidence?: number;      // 神经质程度的累计权重（可选，默认为0）
  conscientiousness?: string;           // 尽责程度（可选）
  conscientiousness_confidence?: number;// 尽责程度的累计权重（可选，默认为0）
  likeness?: string;                    // 喜爱程度（可选）
  likeness_confidence?: number;         // 喜爱程度的累计权重（可选，默认为0）
}

/**
 * 更新PersonInfo时的数据结构
 */
export interface PersonInfoUpdateData {
  id: number;                           // 必需：要更新的记录ID
  is_known?: number;                    // 可选：是否已经认识
  person_id?: string;                   // 可选：人物ID
  person_name?: string;                 // 可选：人物名称
  name_reason?: string;                 // 可选：命名原因
  platform?: string;                   // 可选：平台
  user_id?: string;                     // 可选：用户ID
  nickname?: string;                    // 可选：昵称
  points?: string;                      // 可选：对用户的认知点
  know_times?: number;                  // 可选：认知次数
  know_since?: number;                  // 可选：认知开始时间
  last_know?: number;                   // 可选：最后认知时间
  attitude_to_me?: string;              // 可选：对自己的态度
  attitude_to_me_confidence?: number;   // 可选：对自己的态度的累计权重
  friendly_value?: number;              // 可选：友好度
  friendly_value_confidence?: number;   // 可选：友好度的累计权重
  rudeness?: string;                    // 可选：粗鲁度
  rudeness_confidence?: number;         // 可选：粗鲁度的累计权重
  neuroticism?: string;                 // 可选：神经质程度
  neuroticism_confidence?: number;      // 可选：神经质程度的累计权重
  conscientiousness?: string;           // 可选：尽责程度
  conscientiousness_confidence?: number;// 可选：尽责程度的累计权重
  likeness?: string;                    // 可选：喜爱程度
  likeness_confidence?: number;         // 可选：喜爱程度的累计权重
}

/**
 * PersonInfo分页查询参数
 */
export interface PersonInfoPaginationParams {
  page: number;                  // 页码，从1开始
  pageSize: number;              // 每页记录数
  orderBy?: string;              // 排序字段，默认为'id'
  orderDir?: 'ASC' | 'DESC';     // 排序方向，默认为'ASC'
  filter?: PersonInfoFilterOptions; // 过滤条件
}

/**
 * PersonInfo查询过滤选项
 */
export interface PersonInfoFilterOptions {
  person_id?: string;                   // 按人物ID过滤
  person_name?: string;                 // 按人物名称过滤
  platform?: string;                   // 按平台过滤
  user_id?: string;                     // 按用户ID过滤
  nickname?: string;                    // 按昵称过滤
  is_known?: number;                    // 按是否认识过滤
  points?: string;                      // 按认知点过滤
  attitude_to_me?: string;              // 按对自己的态度过滤
  rudeness?: string;                    // 按粗鲁度过滤
  neuroticism?: string;                 // 按神经质程度过滤
  conscientiousness?: string;           // 按尽责程度过滤
  likeness?: string;                    // 按喜爱程度过滤
  minKnowTimes?: number;                // 最小认知次数
  maxKnowTimes?: number;                // 最大认知次数
  minFriendlyValue?: number;            // 最小友好度
  maxFriendlyValue?: number;            // 最大友好度
  knowSinceStart?: number;              // 认知开始时间范围-开始
  knowSinceEnd?: number;                // 认知开始时间范围-结束
  lastKnowStart?: number;               // 最后认知时间范围-开始
  lastKnowEnd?: number;                 // 最后认知时间范围-结束
}

/**
 * PersonInfo分页查询结果
 */
export interface PersonInfoPaginationResult {
  items: PersonInfoRecord[];     // 当前页的记录列表
  total: number;                 // 总记录数
  totalPages: number;            // 总页数
  currentPage: number;           // 当前页码
  pageSize: number;              // 每页记录数
  hasNext: boolean;              // 是否有下一页
  hasPrev: boolean;              // 是否有上一页
}

/**
 * PersonInfo统计信息
 */
export interface PersonInfoStats {
  total: number;                                 // 总记录数
  totalKnown: number;                            // 已认识的人数
  totalUnknown: number;                          // 未认识的人数
  byPlatform: Record<string, number>;            // 按平台统计
  byFriendlyValue: Record<string, number>;       // 按友好度范围统计
  avgKnowTimes: number;                          // 平均认知次数
  avgFriendlyValue: number;                      // 平均友好度
  totalKnowTimes: number;                        // 总认知次数
  recentActive: number;                          // 最近活跃的人数（7天内有认知的）
  topPersons: PersonInfoRecord[];                // 认知次数最高的前10个人
  byAttitudeToMe: Record<string, number>;        // 按对自己的态度统计
  byRudeness: Record<string, number>;            // 按粗鲁度统计
  byNeuroticism: Record<string, number>;         // 按神经质程度统计
  byConscientiousness: Record<string, number>;   // 按尽责程度统计
  byLikeness: Record<string, number>;            // 按喜爱程度统计
}

/**
 * 平台枚举
 */
export enum Platform {
  QQ = 'qq',
  WECHAT = 'wechat',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  OTHER = 'other'
}

/**
 * 友好度范围枚举
 */
export enum FriendlyValueRange {
  VERY_LOW = 'very_low',        // 0-0.2
  LOW = 'low',                  // 0.21-0.4
  NEUTRAL = 'neutral',          // 0.41-0.6
  HIGH = 'high',                // 0.61-0.8
  VERY_HIGH = 'very_high'       // 0.81-1.0
}

/**
 * 态度评估枚举
 */
export enum AttitudeAssessment {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

/**
 * 个性特征级别枚举
 */
export enum PersonalityLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * PersonInfo验证错误信息
 */
export interface PersonInfoValidationError {
  field: string;                 // 错误字段
  message: string;               // 错误信息
}

/**
 * 认知点列表（用于解析points）
 */
export type PointsList = string[];

/**
 * 态度信心度结构
 */
export interface ConfidenceValue {
  value: string;                 // 态度/特征值
  confidence: number;            // 置信度/累计权重
}

/**
 * 个性特征结构
 */
export interface PersonalityTrait {
  attitude_to_me: ConfidenceValue;      // 对自己的态度
  friendly_value: number;               // 友好度
  friendly_value_confidence: number;    // 友好度置信度
  rudeness: ConfidenceValue;            // 粗鲁度
  neuroticism: ConfidenceValue;         // 神经质程度
  conscientiousness: ConfidenceValue;   // 尽责程度
  likeness: ConfidenceValue;            // 喜爱程度
}
