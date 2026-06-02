// MakeMyTrip Travel Request API Service
import { getToken, getUser } from './utils.js';

// MakeMyTrip API base URL (should be configured in environment)
const MMT_BASE_URL = import.meta.env.VITE_MMT_API_BASE_URL || 'https://api.makemytrip.com'; // Replace with actual URL
const PARTNER_API_KEY = import.meta.env.VITE_MMT_PARTNER_API_KEY;
const CLIENT_CODE = import.meta.env.VITE_MMT_CLIENT_CODE;

/**
 * Generate a unique service ID
 * @returns {string} - Unique service ID
 */
const generateServiceId = () => {
  return `SVC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

/**
 * Generate a unique TRF ID (Travel Request Form ID)
 * @returns {string} - Unique TRF ID
 */
const generateTrfId = () => {
  return `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

/**
 * Make API request to MakeMyTrip
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
const mmtApiRequest = async (endpoint, options = {}) => {
  if (!PARTNER_API_KEY || !CLIENT_CODE) {
    throw new Error('MakeMyTrip API credentials not configured. Please contact administrator.');
  }

  const url = `${MMT_BASE_URL}${endpoint}`;
  
  const config = {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'partner-apikey': PARTNER_API_KEY,
      'client-code': CLIENT_CODE,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    console.log(`MakeMyTrip API Request: ${config.method} ${url}`);
    console.log('Request Headers:', { ...config.headers, 'partner-apikey': '[HIDDEN]' });
    console.log('Request Body:', options.body);
    
    const response = await fetch(url, config);
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('MakeMyTrip API Error:', errorText);
      
      let errorMessage = 'Failed to process travel request';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If not JSON, use the text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('MakeMyTrip API Response:', data);
    return data;
  } catch (error) {
    console.error(`MakeMyTrip API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Create a travel request (Flight/Hotel booking)
 * @param {Object} travelRequestData - Travel request data matching MakeMyTrip API format
 * @returns {Promise<Object>} - Travel request response with URL and status
 */
export const createTravelRequest = async (travelRequestData) => {
  try {
    const user = getUser();
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Ensure the current user is included in paxDetails as primary passenger
    const paxDetails = travelRequestData.travellerDetails?.paxDetails || [];
    const hasPrimaryPax = paxDetails.some(pax => pax.isPrimaryPax);
    
    if (!hasPrimaryPax) {
      // Add current user as primary passenger
      paxDetails.unshift({
        name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        isPrimaryPax: true,
      });
    }

    // Build the complete request payload
    const payload = {
      deviceDetails: travelRequestData.deviceDetails || {
        version: navigator.userAgent,
        platform: 'DESKTOP',
      },
      travellerDetails: {
        paxDetails,
      },
      services: travelRequestData.services,
      reasonForTravel: travelRequestData.reasonForTravel,
      approvalDetails: travelRequestData.approvalDetails,
      trfId: travelRequestData.trfId || generateTrfId(),
    };

    const response = await mmtApiRequest('/corporate/v1/create/partner/travel-request', {
      method: 'POST',
      body: payload,
    });

    // Validate response
    if (response.status !== 'success' || !response.travelRequestUrl) {
      throw new Error(response.message || 'Invalid response from MakeMyTrip API');
    }

    return response;
  } catch (error) {
    console.error('Error creating travel request:', error);
    throw error;
  }
};

/**
 * Recall (cancel) a travel request
 * @param {string} trfId - Travel Request Form ID
 * @param {string} serviceId - Service ID to recall
 * @returns {Promise<Object>} - Recall response
 */
export const recallTravelRequest = async (trfId, serviceId) => {
  try {
    if (!trfId || !serviceId) {
      throw new Error('TRF ID and Service ID are required to recall a travel request');
    }

    const payload = {
      trfId,
      action: 'recalled',
      serviceId,
    };

    const response = await mmtApiRequest('/internal/corporate/v1/update/partner/travel-request', {
      method: 'POST',
      body: payload,
    });

    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to recall travel request');
    }

    return response;
  } catch (error) {
    console.error('Error recalling travel request:', error);
    throw error;
  }
};

/**
 * Create a flight booking request from form data
 * @param {Object} flightFormData - Flight search form data
 * @returns {Promise<Object>} - Travel request response
 */
export const createFlightBookingRequest = async (flightFormData) => {
  try {
    const user = getUser();
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Generate unique service ID
    const serviceId = generateServiceId();

    // Build journey details based on trip type
    const journeyDetails = [];
    
    // Outbound flight
    const departureDate = new Date(flightFormData.departureDate);
    journeyDetails.push({
      from: {
        airportCode: flightFormData.from.airportCode,
        cityName: flightFormData.from.cityName,
        countryCode: flightFormData.from.countryCode,
        countryName: flightFormData.from.countryName,
      },
      to: {
        airportCode: flightFormData.to.airportCode,
        cityName: flightFormData.to.cityName,
        countryCode: flightFormData.to.countryCode,
        countryName: flightFormData.to.countryName,
      },
      departureDate: departureDate.getTime(),
      arrivalDate: departureDate.getTime() + (4 * 60 * 60 * 1000), // Estimate 4 hours later
    });

    // Return flight for round trips
    if (flightFormData.tripType === 'ROUND_TRIP' && flightFormData.returnDate) {
      const returnDate = new Date(flightFormData.returnDate);
      journeyDetails.push({
        from: {
          airportCode: flightFormData.to.airportCode,
          cityName: flightFormData.to.cityName,
          countryCode: flightFormData.to.countryCode,
          countryName: flightFormData.to.countryName,
        },
        to: {
          airportCode: flightFormData.from.airportCode,
          cityName: flightFormData.from.cityName,
          countryCode: flightFormData.from.countryCode,
          countryName: flightFormData.from.countryName,
        },
        departureDate: returnDate.getTime(),
        arrivalDate: returnDate.getTime() + (4 * 60 * 60 * 1000),
      });
    }

    // Build flight service
    const flightService = {
      serviceId,
      tripType: flightFormData.tripType,
      travelClass: flightFormData.travelClass,
      paxDetails: {
        adult: flightFormData.adults || 1,
        child: {
          count: flightFormData.children || 0,
          age: flightFormData.childrenAges || [],
        },
        infant: flightFormData.infants || 0,
      },
      journeyDetails,
    };

    // Build approval details
    const approvalDetails = {
      approvalRequired: flightFormData.requiresApproval || false,
      approverDetails: flightFormData.approvers?.map(approver => ({
        approvalLevel: approver.level,
        name: approver.name,
        emailId: approver.email,
      })) || [],
    };

    // Build complete travel request
    const travelRequest = {
      deviceDetails: {
        version: navigator.userAgent,
        platform: 'DESKTOP',
      },
      travellerDetails: {
        paxDetails: [{
          name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
          email: user.email,
          isPrimaryPax: true,
        }],
      },
      services: {
        FLIGHT: [flightService],
      },
      reasonForTravel: {
        reason: flightFormData.reasonForTravel || 'Student Travel',
      },
      approvalDetails,
    };

    return await createTravelRequest(travelRequest);
  } catch (error) {
    console.error('Error creating flight booking request:', error);
    throw error;
  }
};

/**
 * Helper: Generate service ID for external use
 */
export { generateServiceId, generateTrfId };

export default {
  createTravelRequest,
  recallTravelRequest,
  createFlightBookingRequest,
  generateServiceId,
  generateTrfId,
};
