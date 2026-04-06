import React from "react";

function Card({ title, value, description }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}

export default Card;
