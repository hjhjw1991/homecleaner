import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Scan from './Scan';

describe('Scan Component', () => {
  it('test runner', () => {
    render(<p>Hello Testor</p>); // can't use <text> tag here, because it is supposed to be used only in SVG context
    expect(screen.getByText('Hello Testor')).toBeInTheDocument();
  });
  it('renders content correctly', () => {
    render(<Scan content={<div>Test Content</div>} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});