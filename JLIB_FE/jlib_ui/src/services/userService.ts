import { IUserInfo } from '../interfaces/user-interface/iuserinfo';
import { API_BASE_URL } from '../config/api';

export const MOCK_USERS: IUserInfo[] = [
  {
    user_id: "JL-01",
    user_name: "Akshay More",
    email: "akshay.more@example.com",
    phone: "9876543201",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    created_at: "2026-09-02T16:34:07.836680Z"
  },
  {
    user_id: "JL-02",
    user_name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "9876543202",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    created_at: "2026-08-15T10:12:30.000000Z"
  },
  {
    user_id: "JL-03",
    user_name: "Rohan Verma",
    email: "rohan.verma@example.com",
    phone: "9876543203",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    created_at: "2026-07-20T14:45:10.000000Z"
  }
];

export async function getUsers(): Promise<IUserInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }

    const data: IUserInfo[] = await response.json();
    return data && data.length > 0 ? data : MOCK_USERS;
  } catch (error) {
    console.warn('Backend API unavailable or error fetching users. Using mock users list.', error);
    return MOCK_USERS;
  }
}

export async function createUser(userData: {
  user_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  profile_pic_url?: string;
}): Promise<IUserInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create member: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend API unavailable for creating user. Returning locally generated user.', error);
    return {
      user_id: `JL-${Math.floor(100 + Math.random() * 900)}`,
      user_name: userData.user_name,
      email: userData.email,
      phone: userData.phone || '',
      city: userData.city || '',
      state: userData.state || '',
      country: userData.country || 'India',
      created_at: new Date().toISOString(),
      profile_pic_url: userData.profile_pic_url,
    };
  }
}



