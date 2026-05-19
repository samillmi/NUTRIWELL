const { sendError } = require('../utils/responseHelper');

const checkSubscription = (requiredPlan = 'basic') => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return sendError(res, 401, 'Unauthorized.');
    }

    // Admins and Doctors bypass subscription checks
    if (user.role === 'admin' || user.role === 'doctor') {
      return next();
    }

    const sub = user.subscription;

    if (!sub || sub.status !== 'active') {
      return sendError(res, 403, 'No active subscription. Please upgrade your plan.');
    }

    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      return sendError(res, 403, 'Your subscription has expired. Please renew your plan.');
    }

    // Plan hierarchy: free < basic < standard < premium
    const plans = ['free', 'basic', 'standard', 'premium'];
    const userPlanIdx = plans.indexOf(sub.plan || 'free');
    const requiredPlanIdx = plans.indexOf(requiredPlan);

    if (userPlanIdx < requiredPlanIdx) {
      return sendError(res, 403, `This feature requires a ${requiredPlan} plan.`);
    }

    next();
  };
};

module.exports = { checkSubscription };
