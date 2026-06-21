import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

// ==========================================
// MODELS DEFINITION
// ==========================================

export class User extends Model {
  declare id: string;
  declare email: string;
  declare hashed_password: string;
  declare full_name: string;
  declare role: string;
  declare phone: string | null;
  declare university: string | null;
  declare whatsapp: string | null;
  declare facebook_link: string | null;
  declare linkedin_link: string | null;
  declare profile_picture: string | null;
  declare is_active: boolean;
  declare created_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    hashed_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "student",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    university: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
  }
);

export class AmbassadorProfile extends Model {
  declare user_id: string;
  declare referral_code: string;
  declare referral_url: string;
  declare commission_rate: number;
  declare balance: number;
}

AmbassadorProfile.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    referral_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    referral_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commission_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10.0,
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    sequelize,
    tableName: "ambassador_profiles",
    modelName: "AmbassadorProfile",
  }
);

export class Referral extends Model {
  declare id: string;
  declare ambassador_id: string;
  declare referred_user_id: string;
  declare status: string;
  declare commission_earned: number;
  declare created_at: Date;
}

Referral.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ambassador_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    referred_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "registered",
    },
    commission_earned: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "referrals",
    modelName: "Referral",
  }
);

export class Order extends Model {
  declare id: string;
  declare student_id: string;
  declare specialist_id: string | null;
  declare title: string;
  declare university: string;
  declare course_name: string;
  declare service_type: string;
  declare task_description: string;
  declare word_count: number | null;
  declare slide_count: number | null;
  declare deadline: Date;
  declare priority_level: string;
  declare status: string;
  declare quote_amount: number | null;
  declare deposit_amount: number | null;
  declare final_amount: number | null;
  declare admin_override_quote: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    specialist_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    university: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    task_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    word_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    slide_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    priority_level: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "standard",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "submitted",
    },
    quote_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    admin_override_quote: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "orders",
    modelName: "Order",
  }
);

export class OrderFile extends Model {
  declare id: string;
  declare order_id: string;
  declare uploaded_by: string;
  declare file_name: string;
  declare file_key: string;
  declare file_size: number;
  declare file_type: string;
  declare file_category: string;
  declare is_clean: boolean;
  declare created_at: Date;
}

OrderFile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_clean: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "order_files",
    modelName: "OrderFile",
  }
);

export class Payment extends Model {
  declare id: string;
  declare order_id: string;
  declare student_id: string;
  declare amount: number;
  declare payment_type: string;
  declare payment_method: string;
  declare status: string;
  declare proof_file_key: string;
  declare verified_by: string | null;
  declare verified_at: Date | null;
  declare created_at: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    proof_file_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "payments",
    modelName: "Payment",
  }
);

export class ChatMessage extends Model {
  declare id: string;
  declare order_id: string;
  declare sender_id: string;
  declare message_text: string;
  declare attachment_key: string | null;
  declare created_at: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachment_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "chat_messages",
    modelName: "ChatMessage",
  }
);

export class PricingRule extends Model {
  declare id: number;
  declare service_type: string;
  declare base_price: number;
  declare price_per_word: number;
  declare price_per_slide: number;
  declare urgent_multiplier: number;
  declare express_multiplier: number;
}

PricingRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 20.0,
    },
    price_per_word: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0.05,
    },
    price_per_slide: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    urgent_multiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.5,
    },
    express_multiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 2.0,
    },
  },
  {
    sequelize,
    tableName: "pricing_rules",
    modelName: "PricingRule",
  }
);

export class BlogPost extends Model {
  declare id: string;
  declare title: string;
  declare slug: string;
  declare content: string;
  declare category: string;
  declare published: boolean;
  declare created_at: Date;
}

BlogPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "blog_posts",
    modelName: "BlogPost",
  }
);

export class LeadCapture extends Model {
  declare id: string;
  declare type: string;
  declare email: string;
  declare phone: string | null;
  declare name: string | null;
  declare message: string | null;
  declare created_at: Date;
}

LeadCapture.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "lead_captures",
    modelName: "LeadCapture",
  }
);

export class AuditLog extends Model {
  declare id: string;
  declare user_id: string | null;
  declare action: string;
  declare details: string | null;
  declare created_at: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    modelName: "AuditLog",
  }
);

// ==========================================
// RELATIONSHIPS DEFINITION
// ==========================================

// User <-> AmbassadorProfile
User.hasOne(AmbassadorProfile, { foreignKey: "user_id", as: "ambassador_profile", onDelete: "CASCADE" });
AmbassadorProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

// AmbassadorProfile <-> Referral
AmbassadorProfile.hasMany(Referral, { foreignKey: "ambassador_id", as: "referrals", onDelete: "CASCADE" });
Referral.belongsTo(AmbassadorProfile, { foreignKey: "ambassador_id", as: "ambassador" });

// User <-> Referral (Referred student)
User.hasOne(Referral, { foreignKey: "referred_user_id", as: "referral_received", onDelete: "CASCADE" });
Referral.belongsTo(User, { foreignKey: "referred_user_id", as: "referred_user" });

// User <-> Order (Student)
User.hasMany(Order, { foreignKey: "student_id", as: "student_orders", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "student_id", as: "student" });

// User <-> Order (Specialist)
User.hasMany(Order, { foreignKey: "specialist_id", as: "specialist_orders", onDelete: "SET NULL" });
Order.belongsTo(User, { foreignKey: "specialist_id", as: "specialist" });

// Order <-> OrderFile
Order.hasMany(OrderFile, { foreignKey: "order_id", as: "files", onDelete: "CASCADE" });
OrderFile.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// User <-> OrderFile (Uploader)
User.hasMany(OrderFile, { foreignKey: "uploaded_by", as: "uploaded_files", onDelete: "CASCADE" });
OrderFile.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });

// Order <-> Payment
Order.hasMany(Payment, { foreignKey: "order_id", as: "payments", onDelete: "CASCADE" });
Payment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// User <-> Payment (Student)
User.hasMany(Payment, { foreignKey: "student_id", as: "payments", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "student_id", as: "student" });

// User <-> Payment (Verifier/Admin)
User.hasMany(Payment, { foreignKey: "verified_by", as: "verified_payments", onDelete: "SET NULL" });
Payment.belongsTo(User, { foreignKey: "verified_by", as: "verifier" });

// Order <-> ChatMessage
Order.hasMany(ChatMessage, { foreignKey: "order_id", as: "chat_messages", onDelete: "CASCADE" });
ChatMessage.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// User <-> ChatMessage (Sender)
User.hasMany(ChatMessage, { foreignKey: "sender_id", as: "chat_messages", onDelete: "CASCADE" });
ChatMessage.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: "user_id", as: "audit_logs", onDelete: "SET NULL" });
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
