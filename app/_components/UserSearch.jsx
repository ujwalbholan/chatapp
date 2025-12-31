import React from "react";
import "../_style/UserSearch.css";

const UserSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="user-search">
      <input
        type="text"
        placeholder="Search users..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search users"
      />
    </div>
  );
};

export default UserSearch;