// client/src/components/TaskerDashboard.tsx
    import React, { useEffect, useState } from "react";
    import axios from "axios";

    export default function TaskerDashboard(){
      const token = localStorage.getItem("token");
      const [profile, setProfile] = useState<any>(null);
      useEffect(()=>{
        if(!token) return;
        axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } }).then(r=>setProfile(r.data.user));
      }, []);
      if(!profile) return <div>Loading...</div>;
      return (
        <div>
          <h2>Tasker Dashboard</h2>
          <div>Wallet balance: ${(profile.wallet_balance_cents || 0)/100}</div>
          <div>Your jobs here (create/edit) — add UI to create jobs that POST to /api/tasks</div>
        </div>
      );
    }
