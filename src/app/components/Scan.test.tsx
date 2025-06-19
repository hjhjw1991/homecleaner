import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Scan from './Scan';

describe('Scan Component', () => {
  it('test runner', () => {
    render(<text>Hello Testor</text>);
    expect(screen.getByText('Hello Testor')).toBeInTheDocument();
  });
  it('renders content correctly', () => {
    render(<Scan content={<div>Test Content</div>} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});