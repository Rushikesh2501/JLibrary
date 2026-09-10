import { IUserInfo } from '../interfaces/user-interface/iuserinfo';
import { API_BASE_URL } from '../config/api';

/**
 * Safely resolves a member's profile picture URL.
 * Routes Supabase storage URLs through the backend avatar endpoint so that
 * client-side ISP DNS blocks on *.supabase.co do not prevent avatars from displaying.
 */
export function getUserAvatarUrl(user?: IUserInfo | null): string | undefined {
  if (!user) return undefined;
  const rawUrl = user.profile_pic_url || user.avatar_url;
  if (!rawUrl || !rawUrl.trim()) return undefined;

  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.includes('supabase.co')) {
    return `${API_BASE_URL}/users/${encodeURIComponent(user.user_id)}/avatar`;
  }
  return trimmed;
}

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

export async function uploadUserProfilePic(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload profile picture: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.profile_pic_url;
}

export async function deleteUserProfilePic(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/avatar`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete profile picture: ${response.status} ${errorText}`);
  }
}

export async function updateUser(userId: string, data: Partial<IUserInfo>): Promise<IUserInfo> {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update member: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete member: ${response.status} ${errorText}`);
  }

  return response.json();
}



