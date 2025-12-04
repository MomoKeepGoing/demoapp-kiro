import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContactsPage } from './ContactsPage';
import * as contactApi from '../../utils/contactApi';

// Mock the Amplify UI authenticator
vi.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => ({
    user: {
      userId: 'test-user-123',
      signInDetails: {
        loginId: 'test@example.com',
      },
    },
  }),
}));

// Mock the contact API
vi.mock('../../utils/contactApi', () => ({
  searchUsers: vi.fn(),
  createContact: vi.fn(),
  listContacts: vi.fn(),
  deleteContact: vi.fn(),
}));

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    vi.mocked(contactApi.listContacts).mockResolvedValue([]);
  });

  it('renders the contacts page with header', async () => {
    render(<ContactsPage />);
    
    expect(screen.getByText('联系人')).toBeInTheDocument();
    expect(screen.getByText('搜索和管理您的联系人')).toBeInTheDocument();
  });

  it('loads contacts on mount', async () => {
    const mockContacts = [
      {
        userId: 'test-user-123',
        contactUserId: 'contact-1',
        contactUsername: 'John Doe',
        contactAvatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    ];
    
    vi.mocked(contactApi.listContacts).mockResolvedValue(mockContacts);
    
    render(<ContactsPage />);
    
    await waitFor(() => {
      expect(contactApi.listContacts).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('displays search bar', () => {
    render(<ContactsPage />);
    
    const searchInput = screen.getByPlaceholderText('搜索用户名或邮箱...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays contact list section', async () => {
    render(<ContactsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('加载联系人...')).not.toBeInTheDocument();
    });
  });
});
