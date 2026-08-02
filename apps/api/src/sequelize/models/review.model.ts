import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ReviewAttributes {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReviewCreation = Optional<
  ReviewAttributes,
  'id' | 'comment' | 'createdAt' | 'updatedAt'
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
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initReviewModel(sequelize: Sequelize) {
  ReviewModel.init(
    {
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
