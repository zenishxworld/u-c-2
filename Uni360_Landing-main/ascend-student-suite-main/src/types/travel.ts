// MakeMyTrip Travel Request API Types

export type TripType = 'ONEWAY' | 'ROUND_TRIP' | 'MULTICITY';
export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS';
export type Platform = 'ANDROID' | 'IOS' | 'DESKTOP';

export interface DeviceDetails {
  version: string;
  platform: Platform;
}

export interface PaxDetail {
  name: string;
  email: string;
  isPrimaryPax: boolean;
}

export interface TravellerDetails {
  paxDetails: PaxDetail[];
}

export interface ChildDetails {
  count: number;
  age: number[];
}

export interface PaxDetailsCount {
  adult: number;
  child: ChildDetails;
  infant: number;
}

export interface LocationDetails {
  airportCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
}

export interface JourneyDetail {
  from: LocationDetails;
  to: LocationDetails;
  departureDate: number; // epoch time in milliseconds
  arrivalDate: number;   // epoch time in milliseconds
}

export interface FlightService {
  serviceId: string;
  tripType: TripType;
  travelClass: TravelClass;
  paxDetails: PaxDetailsCount;
  journeyDetails: JourneyDetail[];
}

export interface RoomPaxDetails {
  adult: number;
  child: ChildDetails;
  infant: number;
}

export interface HotelService {
  serviceId: string;
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  checkin: number;  // epoch time in milliseconds
  checkout: number; // epoch time in milliseconds
  roomDetailsPaxWise: RoomPaxDetails[];
}

export interface Services {
  FLIGHT?: FlightService[];
  HOTEL?: HotelService[];
}

export interface ReasonForTravel {
  reason: string;
}

export interface ApproverDetail {
  approvalLevel: number;
  name: string;
  emailId: string;
}

export interface ApprovalDetails {
  approvalRequired: boolean;
  approverDetails: ApproverDetail[];
}

export interface TravelRequest {
  deviceDetails: DeviceDetails;
  travellerDetails: TravellerDetails;
  services: Services;
  reasonForTravel: ReasonForTravel;
  approvalDetails: ApprovalDetails;
  trfId?: string;
}

export interface TravelRequestResponse {
  travelRequestUrl: string;
  status: string;
  statusCode: number;
  responseCode: string;
  message: string;
}

export interface RecallTravelRequest {
  trfId: string;
  action: 'recalled';
  serviceId: string;
}

export interface RecallTravelRequestResponse {
  status: string;
  statusCode: number;
  responseCode: string;
  message: string;
}

// Form types for UI
export interface FlightSearchForm {
  tripType: TripType;
  travelClass: TravelClass;
  from: {
    airportCode: string;
    cityName: string;
    countryCode: string;
    countryName: string;
  };
  to: {
    airportCode: string;
    cityName: string;
    countryCode: string;
    countryName: string;
  };
  departureDate: Date;
  returnDate?: Date;
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
  reasonForTravel: string;
  requiresApproval: boolean;
  approvers?: Array<{
    name: string;
    email: string;
    level: number;
  }>;
}
