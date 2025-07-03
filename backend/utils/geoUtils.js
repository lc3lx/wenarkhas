const geolib = require('geolib');

/**
 * حساب المسافة بين نقطتين إحداثيتين (بالكيلومترات)
 * @param {Object} point1 - النقطة الأولى {latitude, longitude}
 * @param {Object} point2 - النقطة الثانية {latitude, longitude}
 * @returns {Number} المسافة بالكيلومترات
 */
const calculateDistance = (point1, point2) => {
  if (!point1 || !point2 || !point1.latitude || !point1.longitude || !point2.latitude || !point2.longitude) {
    throw new Error('يجب توفير إحداثيات صحيحة للنقطتين');
  }
  
  // تحويل الدرجات إلى راديان
  const R = 6371; // نصف قطر الأرض بالكيلومترات
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // المسافة بالكيلومترات
  
  return parseFloat(distance.toFixed(2));
};

/**
 * حساب الوقت المقدر للوصول (بالدقائق)
 * @param {Number} distance - المسافة بالكيلومترات
 * @param {String} vehicleType - نوع المركبة (motorcycle, car, bicycle, on_foot)
 * @returns {Number} الوقت المقدر بالدقائق
 */
const calculateEstimatedTime = (distance, vehicleType = 'motorcycle') => {
  const averageSpeeds = {
    motorcycle: 30, // km/h
    car: 25,        // km/h (أبطأ بسبب حركة المرور)
    bicycle: 15,    // km/h
    on_foot: 5      // km/h
  };
  
  const speed = averageSpeeds[vehicleType] || 20; // سرعة افتراضية 20 كم/ساعة
  
  // الوقت بالساعات * 60 لتحويله إلى دقائق
  const timeInMinutes = (distance / speed) * 60;
  
  // إضافة 10-20% كهامش أمان
  const safetyMargin = 1 + (Math.random() * 0.2 + 0.1);
  
  return Math.ceil(timeInMinutes * safetyMargin);
};

/**
 * تحويل الدرجات إلى راديان
 * @param {Number} degrees - القيمة بالدرجات
 * @returns {Number} القيمة بالراديان
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * الحصول على أقرب موظفي التوصيل المتاحين
 * @param {Array} deliveryStaff - مصفوفة موظفي التوصيل
 * @param {Object} destination - الوجهة {latitude, longitude}
 * @param {Number} maxDistance - أقصى مسافة مسموح بها (بالكيلومترات)
 * @returns {Array} مصفوفة موظفي التوصيل المرتبة حسب الأقرب
 */
const getNearestDeliveryStaff = (deliveryStaff, destination, maxDistance = 10) => {
  if (!deliveryStaff || !Array.isArray(deliveryStaff) || !destination) {
    return [];
  }
  
  return deliveryStaff
    .map(staff => {
      if (!staff.currentLocation || !staff.currentLocation.coordinates) {
        return null;
      }
      
      const staffLocation = {
        latitude: staff.currentLocation.coordinates[1],
        longitude: staff.currentLocation.coordinates[0]
      };
      
      const distance = calculateDistance(staffLocation, destination);
      
      if (distance > maxDistance) {
        return null;
      }
      
      return {
        ...staff.toObject(),
        distance,
        estimatedTime: calculateEstimatedTime(distance, staff.vehicleType)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
};

module.exports = {
  calculateDistance,
  calculateEstimatedTime,
  getNearestDeliveryStaff,
  toRad
};
