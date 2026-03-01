// client/src/components/ReviewsList.tsx
    import React, { useEffect, useState } from "react";
    import axios from "axios";

    export default function ReviewsList({taskerId}:{taskerId:number}){
      const [data,setData] = useState<any>(null);
      useEffect(()=>{
        axios.get(`/api/users/tasker/${taskerId}`).then(r=>setData(r.data));
      }, [taskerId]);
      if(!data) return <div>Loading...</div>;
      return (
        <div>
          <h3>Rating: {data.average_rating || "No reviews yet"}</h3>
          <ul>{data.reviews.map((r:any)=> <li key={r.id}>{r.rating} — {r.body}</li>)}</ul>
        </div>
      );
    }
