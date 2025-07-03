/**
 * @swagger
 * tags:
 *   name: Delivery
 *   description: Delivery staff management
 */

/**
 * @swagger
 * /api/v1/delivery-staff:
 *   post:
 *     summary: Create a new delivery staff
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - nationalId
 *               - phone
 *               - vehicleType
 *               - vehicleNumber
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to be assigned as delivery staff
 *               nationalId:
 *                 type: string
 *                 description: National ID of the delivery staff
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *               vehicleType:
 *                 type: string
 *                 enum: [motorcycle, car, bicycle, on_foot]
 *                 description: Type of delivery vehicle
 *               vehicleNumber:
 *                 type: string
 *                 description: Vehicle registration number
 *               bankAccount:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountHolderName:
 *                     type: string
 *                   iban:
 *                     type: string
 *     responses:
 *       201:
 *         description: Delivery staff created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *
 *   get:
 *     summary: Get all delivery staff
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: List of delivery staff
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * /api/v1/delivery-staff/{id}:
 *   get:
 *     summary: Get delivery staff by ID
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery staff ID
 *     responses:
 *       200:
 *         description: Delivery staff details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Delivery staff not found
 *
 *   delete:
 *     summary: Delete delivery staff
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery staff ID
 *     responses:
 *       204:
 *         description: Delivery staff deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Delivery staff not found
 */

/**
 * @swagger
 * /api/v1/delivery-staff/me/availability:
 *   patch:
 *     summary: Update delivery staff availability
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Availability status
 *               currentLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     format: float
 *                   longitude:
 *                     type: number
 *                     format: float
 *                   address:
 *                     type: string
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Delivery staff access required
 */

/**
 * @swagger
 * /api/v1/delivery-staff/{id}/approve:
 *   patch:
 *     summary: Approve/reject delivery staff
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery staff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *                 description: Approval status
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection (if rejected)
 *     responses:
 *       200:
 *         description: Delivery staff status updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Delivery staff not found
 */

/**
 * @swagger
 * /api/v1/delivery-staff/stats/{id?}:
 *   get:
 *     summary: Get delivery staff statistics
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: Delivery staff ID (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: Delivery statistics
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
