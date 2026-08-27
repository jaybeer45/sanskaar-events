// src/components/routing/AppRouter.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layout/MainLayout';


// Pages (lazy loaded)
import { lazy, Suspense } from 'react';
import Spinner from '../ui/Spinner/Spinner';

const HomePage            = lazy(() => import('../../pages/Home/HomePage'));
const TonightPage         = lazy(() => import('../../pages/Tonight/TonightPage'));
const EventDetailPage     = lazy(() => import('../../pages/EventDetail/EventDetailPage'));
const ConfirmBookingPage  = lazy(() => import('../../pages/Booking/ConfirmBookingPage'));
const PaymentPage         = lazy(() => import('../../pages/Booking/PaymentPage'));
const VendorsPage         = lazy(() => import('../../pages/Vendors/VendorsPage'));
const VendorProfilePage   = lazy(() => import('../../pages/VendorProfile/VendorProfilePage'));
const MarketplacePage     = lazy(() => import('../../pages/Marketplace/MarketplacePage'));
const OrganizerPage       = lazy(() => import('../../pages/Organizer/OrganizerPage'));
const AdminPage           = lazy(() => import('../../pages/Admin/AdminPage'));
const ProfilePage         = lazy(() => import('../../pages/Profile/ProfilePage'));
const NotFoundPage        = lazy(() => import('../../pages/NotFound/NotFoundPage'));
const LoginPage           = lazy(()=> import ('../../pages/Login/LoginPage')) ;
 const SignupPage         = lazy(()=> import('../../pages/Login/SignUpPage')) ;
 const MapPages           = lazy(()=>import('../../pages/Map/MapPages'));
 const ForgotPasswordPage = lazy(()=> import('../../pages/Login/ForgotPasswordPage'))
 const OnboardingPage = lazy(() => import('../../pages/Onboarding/OnboardingPage'));
 const ProfileEditPage = lazy(() => import('../../pages/Profile/ProfileEditPage'));
 const OrganizerRegisterPage = lazy(() => import('../../pages/Organizer/OrganizerRegisterPage'));
const OrganizerKycPage      = lazy(() => import('../../pages/Organizer/OrganizerKycPage'));
const MyEventsPage    = lazy(() => import('../../pages/Organizer/MyEventsPage'));
const EventStaffPage  = lazy(() => import('../../pages/Organizer/EventStaffPage'));
const CheckInPage     = lazy(() => import('../../pages/Organizer/CheckInPage'));
const VendorRegisterPage  = lazy(() => import('../../pages/Vendors/VendorRegisterPage'));
const VendorDashboardPage = lazy(() => import('../../pages/Vendors/VendorDashboardPage'));
const VendorPackagesPage  = lazy(() => import('../../pages/Vendors/VendorPackagesPage'));
const VendorAddonsPage    = lazy(() => import('../../pages/Vendors/VendorAddonsPage'));
const VendorLeadsPage = lazy(() => import('../../pages/Vendors/VendorLeadsPage'));
const  RequestMatchesPage = lazy(() => import('../../pages/Marketplace/RequestMatchesPage'))
const MyRequestsPage      = lazy(() => import('../../pages/Marketplace/MyRequestsPage'));
const VendorBookingsPage = lazy(()=>import('../../pages/Vendors/VendorBookingsPage'))
const VendorPayoutsPage = lazy(() => import('../../pages/Vendors/VendorPayoutsPage'))
 




const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>}>
      <Routes>
        {/* Public routes with shared layout */}
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME}            element={<HomePage />} />
          <Route path={ROUTES.TONIGHT}         element={<TonightPage />} />
          <Route path={ROUTES.EVENT_DETAIL}    element={<EventDetailPage />} />
          <Route path={ROUTES.VENDORS}         element={<VendorsPage />} />
          <Route path={ROUTES.VENDOR_PROFILE}  element={<VendorProfilePage />} />
          <Route path={ROUTES.MARKETPLACE}     element={<MarketplacePage />} />
          <Route path={ROUTES.LOGIN}     element={<LoginPage />} />
          <Route path={ROUTES.SIGNUP}     element={<SignupPage />} />
          <Route path={ROUTES.MAP}     element={<MapPages />} />
          <Route path={ROUTES.FORGOT} element={< ForgotPasswordPage />} />
          <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} /> 
          <Route path={ROUTES.PROFILE_EDIT}     element={<ProfileEditPage />} />
         


        </Route>

         {/* Auth required */}
        <Route element={<ProtectedRoute roles={['user', 'organizer', 'vendor', 'admin', 'moderator', 'event_team']} />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.CONFIRM_BOOKING}    element={<ConfirmBookingPage />} />
            <Route path={ROUTES.PAYMENT}            element={<PaymentPage />} />
            <Route path={ROUTES.ORGANIZER_SUBMIT}   element={<OrganizerPage />} />
            <Route path={ROUTES.ORGANIZER_REGISTER} element={<OrganizerRegisterPage />} />
            <Route path={ROUTES.ORGANIZER_KYC}      element={<OrganizerKycPage />} />
            <Route path={ROUTES.MY_EVENTS}    element={<MyEventsPage />} />
            <Route path={ROUTES.EVENT_STAFF}   element={<EventStaffPage />} />
            <Route path={ROUTES.EVENT_CHECKIN} element={<CheckInPage />} />
            <Route path={ROUTES.PROFILE}            element={<ProfilePage />} />
            <Route path={ROUTES.VENDOR_REGISTER}  element={<VendorRegisterPage />} />
            <Route path={ROUTES.VENDOR_DASHBOARD} element={<VendorDashboardPage />} />
            <Route path={ROUTES.VENDOR_PACKAGES}  element={<VendorPackagesPage />} />
            <Route path={ROUTES.VENDOR_ADDONS}    element={<VendorAddonsPage />} />
            <Route path={ROUTES.VENDOR_LEADS}     element={<VendorLeadsPage />} />
          <Route path={ROUTES.REQUEST_MATCHES}     element={<RequestMatchesPage />} />
          <Route path={ROUTES.MY_REQUESTS}      element={<MyRequestsPage />} />
          <Route path={ROUTES.VENDOR_BOOKINGS}      element={<VendorBookingsPage />} />
          <Route path={ROUTES.VENDOR_PAYOUTS}       element={<VendorPayoutsPage />} />


          </Route>
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
          </Route>
        </Route>

        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
