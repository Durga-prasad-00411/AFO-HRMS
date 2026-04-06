import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import axios from "axios";
import "../../styles/tables.css";

const Holidays = () => {

  const navigate = useNavigate();

  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const API_URL = "http://localhost:5000/api/holidays";

  // ================= FETCH HOLIDAYS =================

  const fetchHolidays = async () => {
    try {

      const res = await axios.get(API_URL);

      console.log("Fetched holidays:", res.data);

      setHolidays(res.data);

    } catch (error) {

      console.error("Error fetching holidays:", error);

    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // ================= DELETE =================

  const handleDeleteClick = (holiday) => {
    setSelectedHoliday(holiday);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {

    try {

      await axios.delete(`${API_URL}/${selectedHoliday.id}`);

      setShowDeleteModal(false);

      fetchHolidays();

    } catch (error) {

      console.error("Delete error:", error);

    }

  };

  // ================= VIEW =================

  const handleViewClick = (holiday) => {
    setSelectedHoliday(holiday);
    setShowViewModal(true);
  };

  // ================= SEARCH =================

  const filteredHolidays = holidays.filter((holiday) =>
    holiday.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (

    <div className="simple-container theme-pink">

      <h2 className="page-title">Holidays</h2>

      {/* TOP BAR */}

      <div className="top-bar">

        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/add-holiday")}
        >
          + Add Holiday
        </button>

        <div className="search-wrapper">

          <input
            type="text"
            placeholder="Search holiday"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <FaSearch className="search-icon" />

        </div>

      </div>

      {/* TABLE */}

      <div className="table-wrapper">

        <table className="leave-table">

          <thead>

            <tr>
              <th>Holiday Name</th>
              <th>Date</th>
              <th>Holiday Type</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {filteredHolidays.length > 0 ? (

              filteredHolidays.map((holiday) => (

                <tr key={holiday.id}>

                  <td>{holiday.title}</td>

                  <td>
                    {new Date(holiday.holiday_date).toLocaleDateString()}
                  </td>

                  <td>{holiday.holiday_type}</td>

                  <td>

                    <div className="action-buttons">

                      {/* VIEW */}

                      <button
                        className="icon-btn view-btn"
                        onClick={() => handleViewClick(holiday)}
                      >
                        <FaEye />
                      </button>

                      {/* EDIT */}

                      <button
                        className="icon-btn edit-btn"
                        onClick={() =>
                          navigate(`/superadmin/edit-holiday/${holiday.id}`)
                        }
                      >
                        <FaEdit />
                      </button>

                      {/* DELETE */}

                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDeleteClick(holiday)}
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="4">No holidays found</td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* VIEW MODAL */}

      {showViewModal && selectedHoliday && (

        <div className="modal-overlay">

          <div className="modal-box large-modal">

            <h3>Holiday Details</h3>

            <div className="view-details-grid">

              <div className="view-detail-item">
                <label>Holiday Name</label>
                {selectedHoliday.title}
              </div>

              <div className="view-detail-item">
                <label>Date</label>
                {new Date(selectedHoliday.holiday_date).toLocaleDateString()}
              </div>

              <div className="view-detail-item">
                <label>Holiday Type</label>
                {selectedHoliday.holiday_type}
              </div>

              <div className="view-detail-item">
                <label>Description</label>
                {selectedHoliday.description || "-"}
              </div>

            </div>

            <div className="modal-buttons">

              <button
                className="no-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {showDeleteModal && (

        <div className="modal-overlay">

          <div className="modal-box">

            <p>Are you sure you want to delete this holiday?</p>

            <div className="modal-buttons">

              <button className="yes-btn" onClick={confirmDelete}>
                Yes
              </button>

              <button
                className="no-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
};

export default Holidays;