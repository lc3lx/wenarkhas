/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and tracking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *         store:
 *           type: string
 *           description: Store ID
 *         quantity:
 *           type: number
 *           minimum: 1
 *         price:
 *           type: number
 *           minimum: 0
 *         totalPrice:
 *           type: number
 *           minimum: 0
 * 
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the order
 *         user:
 *           type: string
 *           description: User ID who placed the order
 *         store:
 *           type: string
 *           description: Store ID where the order was placed
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         deliveryAddress:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               default: 'Point'
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *             address:
 *               type: string
 *             details:
 *               type: string
 *             phone:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pending, confirmed, processing, ready_for_pickup, assigned, on_delivery, delivered, cancelled, refunded]
 *           default: pending
 *         deliveryFee:
 *           type: number
 *           minimum: 0
 *         subtotal:
 *           type: number
 *           minimum: 0
 *         total:
 *           type: number
 *           minimum: 0
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, wallet, apple_pay, google_pay]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           default: pending
 *         deliveryType:
 *           type: string
 *           enum: [store, platform]
 *         deliveryStaff:
 *           type: string
 *           description: Delivery staff ID (if assigned)
 *         estimatedDeliveryTime:
 *           type: string
 *           format: date-time
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         cancellationReason:
 *           type: string
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - deliveryAddress
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *               deliveryAddress:
 *                 $ref: '#/components/schemas/Order/properties/deliveryAddress'
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, wallet]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/orders/store-orders:
 *   get:
 *     summary: Get store's orders (for store owners)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of store's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Store owner access required
 */

/**
 * @swagger
 * /api/v1/orders/delivery-orders:
 *   get:
 *     summary: Get delivery staff's assigned orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of delivery staff's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Delivery staff access required
 */

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this order
 *       404:
 *         description: Order not found
 *
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, processing, ready_for_pickup, on_delivery, delivered, cancelled]
 *               cancellationReason:
 *                 type: string
 *                 description: Required when status is 'cancelled'
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this order
 *       404:
 *         description: Order not found
 */
