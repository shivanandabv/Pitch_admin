# PitchXPO Admin — React/Vite Final

A responsive PitchXPO Admin Panel using the supplied PITCH visual style.

## Run
```bash
npm install
npm run dev
```

## Demo login
- Email: `admin@pitchxpo.com`
- Password: `Admin@1234`

## Notes
- Currency is USD throughout.
- Events use From Date and To Date.
- Applications, Payments, Events, Types & Pricing and Admin Users support add/edit/delete and status actions.
- Data is stored in browser localStorage for this prototype.
- Login/logout and password-reset flows are included.
- The app uses a versioned localStorage key (`pitchxpo_admin_v4`) so stale data from earlier builds cannot blank the dashboard.
