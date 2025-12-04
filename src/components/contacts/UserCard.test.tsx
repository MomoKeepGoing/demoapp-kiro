import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';
import type { UserProfile } from '../../utils/contactApi';

describe('UserCard', () => {
  const mockUser: UserProfile = {
    userId: 'user1',
    username: 'Alice',
    email: 'alice@example.com',
    avatarUrl: null,
  };

  const mockOnAddContact = vi.fn();

  it('should display user information', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={false}
        onAddContact={mockOnAddContact}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('should show add button for non-contacts', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={false}
        onAddContact={mockOnAddContact}
      />
    );

    const addButton = screen.getByText('添加联系人');
    expect(addButton).toBeInTheDocument();
  });

  it('should show badge for existing contacts', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={true}
        onAddContact={mockOnAddContact}
      />
    );

    expect(screen.getByText('已添加')).toBeInTheDocument();
    expect(screen.queryByText('添加联系人')).not.toBeInTheDocument();
  });

  it('should call onAddContact when button clicked', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={false}
        onAddContact={mockOnAddContact}
      />
    );

    const addButton = screen.getByText('添加联系人');
    fireEvent.click(addButton);

    expect(mockOnAddContact).toHaveBeenCalledWith(mockUser);
  });

  it('should show loading state when adding', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={false}
        onAddContact={mockOnAddContact}
        isAdding={true}
      />
    );

    expect(screen.getByText('添加中...')).toBeInTheDocument();
  });

  it('should disable button when adding', () => {
    render(
      <UserCard
        user={mockUser}
        isContact={false}
        onAddContact={mockOnAddContact}
        isAdding={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
