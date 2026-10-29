import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { UserProvider } from './context/UserContext';

// Landing & General
import Landing from './pages/Landing';
import MyProfile from './pages/MyProfile';
import Stats from './pages/Stats';
import NotFound from './pages/NotFound';

// Customers (Profile viewing & edit)
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';

// Shows (Browse & Details)
import ShowList from './pages/shows/ShowList';
import ShowDetail from './pages/shows/ShowDetail';
import ShowForm from './pages/shows/ShowForm';

// Theaters
import TheaterList from './pages/theaters/TheaterList';
import TheaterDetail from './pages/theaters/TheaterDetail';
import TheaterForm from './pages/theaters/TheaterForm';

// Tickets (My Tickets & Ticket Purchase)
import TicketList from './pages/tickets/TicketList';
import TicketDetail from './pages/tickets/TicketDetail';
import TicketForm from './pages/tickets/TicketForm';

// Coupons (Deals & Offers)
import CouponList from './pages/coupons/CouponList';
import CouponDetail from './pages/coupons/CouponDetail';
import CouponForm from './pages/coupons/CouponForm';

// Snacks (Snack Bar & Order)
import SnackList from './pages/snacks/SnackList';
import SnackDetail from './pages/snacks/SnackDetail';
import SnackForm from './pages/snacks/SnackForm';

// Bookings (My Reservations & Reserve Seat)
import BookingList from './pages/bookings/BookingList';
import BookingDetail from './pages/bookings/BookingDetail';
import BookingForm from './pages/bookings/BookingForm';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Home & Profile */}
              <Route path="/" element={<Landing />} />
              <Route path="/profile" element={<MyProfile />} />

              {/* Shows */}
              <Route path="/shows" element={<ShowList />} />
              <Route path="/shows/:id" element={<ShowDetail />} />
              <Route path="/shows/new" element={<ShowForm />} />
              <Route path="/shows/:id/edit" element={<ShowForm />} />

              {/* Bookings / Reservations */}
              <Route path="/bookings" element={<BookingList />} />
              <Route path="/bookings/new" element={<BookingForm />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />

              {/* Tickets */}
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/tickets/new" element={<TicketForm />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/tickets/:id/edit" element={<TicketForm />} />

              {/* Snack Bar */}
              <Route path="/snacks" element={<SnackList />} />
              <Route path="/snacks/new" element={<SnackForm />} />
              <Route path="/snacks/:id" element={<SnackDetail />} />
              <Route path="/snacks/:id/edit" element={<SnackForm />} />

              {/* Deals & Coupons */}
              <Route path="/coupons" element={<CouponList />} />
              <Route path="/coupons/new" element={<CouponForm />} />
              <Route path="/coupons/:id" element={<CouponDetail />} />
              <Route path="/coupons/:id/edit" element={<CouponForm />} />

              {/* Customer Profiles redirected to personal profile only */}
              <Route path="/customers" element={<Navigate to="/profile" replace />} />
              <Route path="/customers/*" element={<Navigate to="/profile" replace />} />

              {/* Venues / Theaters */}
              <Route path="/theaters" element={<TheaterList />} />
              <Route path="/theaters/new" element={<TheaterForm />} />
              <Route path="/theaters/:id" element={<TheaterDetail />} />
              <Route path="/theaters/:id/edit" element={<TheaterForm />} />

              {/* Analytics */}
              <Route path="/stats" element={<Stats />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}
