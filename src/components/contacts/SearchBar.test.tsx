import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders search input with placeholder', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} isSearching={false} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...');
    expect(input).toBeInTheDocument();
  });

  it('displays the current value', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test" onChange={mockOnChange} isSearching={false} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...') as HTMLInputElement;
    expect(input.value).toBe('test');
  });

  it('debounces onChange callback by 300ms', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} isSearching={false} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...');
    
    // Type multiple characters quickly
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Should not call onChange immediately
    expect(mockOnChange).not.toHaveBeenCalled();
    
    // Fast-forward time by 300ms
    vi.advanceTimersByTime(300);
    
    // Should call onChange once with the final value
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('shows loading spinner when isSearching is true', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test" onChange={mockOnChange} isSearching={true} />);
    
    const spinner = document.querySelector('.search-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('disables input when isSearching is true', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test" onChange={mockOnChange} isSearching={true} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('cancels previous debounce timer when typing again', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} isSearching={false} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...');
    
    // Type first value
    fireEvent.change(input, { target: { value: 'first' } });
    
    // Wait 200ms (not enough to trigger)
    vi.advanceTimersByTime(200);
    
    // Type second value (should cancel first timer)
    fireEvent.change(input, { target: { value: 'second' } });
    
    // Wait another 300ms
    vi.advanceTimersByTime(300);
    
    // Should only call onChange once with the second value
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('second');
  });

  it('cleans up timer on unmount', () => {
    const mockOnChange = vi.fn();
    const { unmount } = render(<SearchBar value="" onChange={mockOnChange} isSearching={false} />);
    
    const input = screen.getByPlaceholderText('搜索用户名或邮箱...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Unmount before timer fires
    unmount();
    
    // Advance time
    vi.advanceTimersByTime(300);
    
    // Should not call onChange after unmount
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
