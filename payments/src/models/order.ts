import mongoose from 'mongoose';
import { OrderStatus } from '@aktickets027/common';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

export { OrderStatus };

// An interface that describes the properties that are required to create a new Order
interface OrderAttrs {
    id: string;
    status: OrderStatus;
    version: number;
    userId: string;
    price: number;
}

// An interface that describes the properties that a User Model has
interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
}

// An interface that describes the properties that a User Document has
interface OrderDoc extends mongoose.Document {
    status: OrderStatus;
    version: number;
    userId: string;
    price: number;
}

const OrderSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    userId: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
},
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            }
        }
    }
);

OrderSchema.set('versionKey', 'version');
OrderSchema.plugin(updateIfCurrentPlugin);
OrderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order({
        _id: attrs.id,
        version: attrs.version,
        price: attrs.price,
        userId: attrs.userId,
        status: attrs.status
    });
}

const Order = mongoose.model<OrderDoc, OrderModel>('Order', OrderSchema);

export { Order };