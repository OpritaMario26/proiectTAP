import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders hero text', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Oferte bune la electronice si electrocasnice/i),
    ).toBeInTheDocument();
  });
});
