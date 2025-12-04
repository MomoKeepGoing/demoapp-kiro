import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResults } from './SearchResults';
import type { UserProfile, Contact } from '../../utils/contactApi';

describe('SearchResults', () => {
  const mockUsers: UserProfile[] = [
    {
      userId: 'user1',
      username: 'Alice',
      email: 'alice@example.com',
      avatarUrl: null,
    },
    {
      userId: 'user2',
      username: 'Bob',
      email: 'bob@example.com',
      avatarUrl: null,
    },
  ];

  const mockContacts: Contact[] = [
    {
      userId: 'current-user',
      contactUserId: 'user1',
      contactUsername: 'Alice',
      contactAvatarUrl: null,
    },
  ];

  const mockOnAddContact = vi.fn();

  it('should display loading state', () => {
    render(
      <SearchResults
        results={[]}
        contacts={[]}
        onAddContact={mockOnAddContact}
        isLoading={true}
      />
    );

    expect(screen.getByText('搜索中...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(
      <SearchResults
        results={[]}
        contacts={[]}
        onAddContact={mockOnAddContact}
        error="搜索失败"
      />
    );

    expect(screen.getByText('搜索失败')).toBeInTheDocument();
  });

  it('should display empty state when no results', () => {
    render(
      <SearchResults
        results={[]}
        contacts={[]}
        onAddContact={mockOnAddContact}
      />
    );

    expect(screen.getByText('未找到匹配的用户')).toBeInTheDocument();
    expect(screen.getByText('尝试搜索用户名或邮箱地址')).toBeInTheDocument();
  });

  it('should display search results', () => {
    render(
      <SearchResults
        results={mockUsers}
        contacts={[]}
        onAddContact={mockOnAddContact}
      />
    );

    expect(screen.getByText('找到 2 个用户')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should mark existing contacts', () => {
    render(
      <SearchResults
        results={mockUsers}
        contacts={mockContacts}
        onAddContact={mockOnAddContact}
      />
    );

    // Alice should be marked as added
    const badges = screen.getAllByText('已添加');
    expect(badges).toHaveLength(1);

    // Bob should have add button
    const addButtons = screen.getAllByText('添加联系人');
    expect(addButtons).toHaveLength(1);
  });
});
