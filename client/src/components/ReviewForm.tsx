// client/src/components/ReviewForm.tsx
    import React, { useState } from "react";
    import axios from "axios";

    export default function ReviewForm({taskerId}:{taskerId:number}){
      const [rating,setRating] = useState(5);
      const [body,setBody] = useState("");
      const token = localStorage.getItem("token");
      async function submit(e:any){
        e.preventDefault();
        await axios.post("/api/reviews", { tasker_id: taskerId, rating, body }, { headers: { Authorization: `Bearer ${token}` }});
        alert("Thanks for the review!");
      }
      return (
        <form onSubmit={submit}>
          <label>Rating</label>
          <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map(n=> <option key={n} value={n}>{n} stars</option>)}
          </select>
          <textarea value={body} onChange={e=>setBody(e.target.value)} />
          <button type="submit">Submit</button>
        </form>
      );
    }
