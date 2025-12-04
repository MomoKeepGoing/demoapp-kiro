import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactList } from './ContactList';
import type { Contact } from '../../utils/contactApi';

describe('ContactList', () => {
  const mockContacts: Contact[] = [
    {
      userId: 'current-user',
      contactUserId: 'user1',
      contactUsername: 'Alice',
      contactAvatarUrl: null,
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      userId: 'current-user',
      contactUserId: 'user2',
      contactUsername: 'Bob',
      contactAvatarUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOnDeleteContact = vi.fn();

  it('should display loading state', () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={true}
        onDeleteContact={mockOnDeleteContact}
      />
    );

    expect(screen.getByText('加载联系人...')).toBeInTheDocument();
  });

  it('should display empty state when no contacts', () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={false}
        onDeleteContact={mockOnDeleteContact}
      />
    );

    expect(screen.getByText('暂无联系人')).toBeInTheDocument();
    expect(screen.getByText('使用上方搜索框查找并添加联系人')).toBeInTheDocument();
  });

  it('should display contact list with count', () => {
    render(
      <ContactList
        contacts={mockContacts}
        isLoading={false}
        onDeleteContact={mockOnDeleteContact}
      />
    );

    expect(screen.getByText('我的联系人')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should display all contacts', () => {
    render(
      <ContactList
        contacts={mockContacts}
        isLoading={false}
        onDeleteContact={mockOnDeleteContact}
      />
    );

    // Should display both contacts
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    
    // Should have delete buttons for each contact
    const deleteButtons = screen.getAllByText('删除');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should show deleting state for specific contact', () => {
    render(
      <ContactList
        contacts={mockContacts}
        isLoading={false}
        onDeleteContact={mockOnDeleteContact}
        deletingContactId="user1"
      />
    );

    // Alice should show "删除中..."
    expect(screen.getByText('删除中...')).toBeInTheDocument();
    
    // Bob should still show "删除"
    const deleteButtons = screen.getAllByText('删除');
    expect(deleteButtons).toHaveLength(1);
  });
});
