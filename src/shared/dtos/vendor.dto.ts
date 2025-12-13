export class VendorDto {
  id: number;
  name: string;
  cuisineString?: string;
  heroImage?: string;
  logo?: string;
  rate?: number;
  totalReviews?: number;
  deliveryFee?: string;
  minimumOrderAmount?: number;
  avgDeliveryTime?: string;
  acceptCreditCard?: boolean;
  acceptCash?: boolean;
  branchId?: number;
  restaurantId?: number;
  menuUrl?: string;
  latitude?: string;
  longitude?: string;
}
