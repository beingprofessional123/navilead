const { SMSCreditPlan } = require('../../models'); // Adjust the path to your models index if necessary

/**
 * @desc Get all SMS credit plans
 * @route GET /api/admin/sms-credit-plans
 * @access Private (Admin)
 */
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await SMSCreditPlan.findAll({
            order: [['createdAt', 'DESC']],
        });
        
        return res.status(200).json({
            success: true,
            message: 'SMS credit plans fetched successfully',
            plans,
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch SMS credit plans.',
            error: error.message,
        });
    }
};

/**
 * @desc Create a new SMS credit plan
 * @route POST /api/admin/sms-credit-plans
 * @access Private (Admin)
 */
exports.createPlan = async (req, res) => {
    // Removed express-validator usage. Basic check remains.

    const { name, description, price, smsCount, status } = req.body;

    // Check for required fields based on your model
    if (!name || price === undefined || !smsCount || price < 0 || smsCount < 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid name, price (>=0), and smsCount (>=0).',
        });
    }

    try {
        const newPlan = await SMSCreditPlan.create({
            name,
            description,
            price,
            smsCount,
            status: status || 'active', // Default to active if not provided
        });

        return res.status(201).json({
            success: true,
            message: 'SMS credit plan created successfully',
            plan: newPlan,
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create SMS credit plan.',
            error: error.message,
        });
    }
};

/**
 * @desc Update an existing SMS credit plan
 * @route PUT /api/admin/sms-credit-plans/:id
 * @access Private (Admin)
 */
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body; // Contains fields like name, description, price, smsCount, status

    try {
        const [updated] = await SMSCreditPlan.update(updateData, {
            where: { id },
        });

        if (updated) {
            const updatedPlan = await SMSCreditPlan.findByPk(id);
            return res.status(200).json({
                success: true,
                message: 'SMS credit plan updated successfully',
                plan: updatedPlan,
            });
        }
        
        return res.status(404).json({
            success: false,
            message: 'SMS credit plan not found.',
        });

    } catch (error) {
        console.error('Error updating plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update SMS credit plan.',
            error: error.message,
        });
    }
};

/**
 * @desc Delete an SMS credit plan
 * @route DELETE /api/admin/sms-credit-plans/:id
 * @access Private (Admin)
 */
exports.deletePlan = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await SMSCreditPlan.destroy({
            where: { id },
        });

        if (deleted) {
            return res.status(200).json({
                success: true,
                message: 'SMS credit plan deleted successfully',
            });
        }
        
        return res.status(404).json({
            success: false,
            message: 'SMS credit plan not found.',
        });

    } catch (error) {
        console.error('Error deleting plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete SMS credit plan.',
            error: error.message,
        });
    }
};

/**
 * @desc Update the status of an SMS credit plan
 * @route PUT /api/admin/sms-credit-plans/:id/status
 * @access Private (Admin)
 */
exports.updatePlanStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting status: 'active' or 'inactive'

    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status provided. Must be "active" or "inactive".',
        });
    }

    try {
        const [updated] = await SMSCreditPlan.update(
            { status },
            { where: { id } }
        );

        if (updated) {
            return res.status(200).json({
                success: true,
                message: `SMS credit plan status set to ${status}.`,
            });
        }
        
        return res.status(404).json({
            success: false,
            message: 'SMS credit plan not found.',
        });

    } catch (error) {
        console.error('Error updating plan status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update plan status.',
            error: error.message,
        });
    }
};