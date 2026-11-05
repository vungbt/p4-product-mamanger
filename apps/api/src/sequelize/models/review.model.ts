import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ReviewAttributes {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  orderItemId: string | null;
  moderationStatus: 'pending' | 'published' | 'hidden';
  verifiedPurchase: boolean;
  mediaIds: string[];
  reply: string | null;
  moderationReason: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReviewCreation = Optional<
  ReviewAttributes,
  | 'orderItemId'
  | 'moderationStatus'
  | 'verifiedPurchase'
  | 'mediaIds'
  | 'reply'
  | 'moderationReason'
  | 'version'
  | 'id'
  | 'comment'
  | 'createdAt'
  | 'updatedAt'
>;

export class ReviewModel
  extends Model<ReviewAttributes, ReviewCreation>
  implements ReviewAttributes
{
  declare id: string;
  declare productId: string;
  declare userId: string;
  declare rating: number;
  declare comment: string;
  declare orderItemId: string | null;
  declare moderationStatus: 'pending' | 'published' | 'hidden';
  declare verifiedPurchase: boolean;
  declare mediaIds: string[];
  declare reply: string | null;
  declare moderationReason: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initReviewModel(sequelize: Sequelize) {
  ReviewModel.init(
    {
      orderItemId: { type: DataTypes.UUID, allowNull: true },
      moderationStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
      verifiedPurchase: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      mediaIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false, defaultValue: [] },
      reply: { type: DataTypes.TEXT, allowNull: true },
      moderationReason: { type: DataTypes.TEXT, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.STRING, allowNull: false, field: 'product_id' },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    },
    { sequelize, tableName: 'reviews', underscored: true },
  );
  return ReviewModel;
}
