import React, { useState } from 'react';
import './PaymentForm.css';

function PaymentForm({ amount, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    cardholder_name: '',
  });

  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'card_number') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'card_expiry') {
      formattedValue = formatExpiry(value);
    } else if (name === 'card_cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'cardholder_name') {
      formattedValue = value.toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.card_number || formData.card_number.replace(/\s/g, '').length < 13) {
      newErrors.card_number = 'Please enter a valid card number';
    }

    if (!formData.card_expiry || formData.card_expiry.length !== 5) {
      newErrors.card_expiry = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = formData.card_expiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.card_expiry = 'Invalid month';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.card_expiry = 'Card has expired';
      }
    }

    if (!formData.card_cvv || formData.card_cvv.length < 3) {
      newErrors.card_cvv = 'Please enter a valid CVV';
    }

    if (!formData.cardholder_name || formData.cardholder_name.length < 3) {
      newErrors.cardholder_name = 'Please enter cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        type: 'card',
        card_number: formData.card_number.replace(/\s/g, ''),
        card_expiry: formData.card_expiry,
        card_cvv: formData.card_cvv,
        cardholder_name: formData.cardholder_name,
      });
    }
  };

  return (
    <div className="payment-form__container">
      <div className="payment-form__header">
        <h2>Secure Payment</h2>
        <p className="payment-form__amount">Amount: ${amount.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="payment-form__field">
          <label htmlFor="cardholder_name">Cardholder Name</label>
          <input
            type="text"
            id="cardholder_name"
            name="cardholder_name"
            value={formData.cardholder_name}
            onChange={handleChange}
            placeholder="JOHN DOE"
            maxLength={50}
            className={errors.cardholder_name ? 'error' : ''}
          />
          {errors.cardholder_name && (
            <span className="payment-form__error">{errors.cardholder_name}</span>
          )}
        </div>

        <div className="payment-form__field">
          <label htmlFor="card_number">Card Number</label>
          <input
            type="text"
            id="card_number"
            name="card_number"
            value={formData.card_number}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className={errors.card_number ? 'error' : ''}
          />
          {errors.card_number && (
            <span className="payment-form__error">{errors.card_number}</span>
          )}
        </div>

        <div className="payment-form__row">
          <div className="payment-form__field">
            <label htmlFor="card_expiry">Expiry Date</label>
            <input
              type="text"
              id="card_expiry"
              name="card_expiry"
              value={formData.card_expiry}
              onChange={handleChange}
              placeholder="MM/YY"
              maxLength={5}
              className={errors.card_expiry ? 'error' : ''}
            />
            {errors.card_expiry && (
              <span className="payment-form__error">{errors.card_expiry}</span>
            )}
          </div>

          <div className="payment-form__field">
            <label htmlFor="card_cvv">CVV</label>
            <input
              type="text"
              id="card_cvv"
              name="card_cvv"
              value={formData.card_cvv}
              onChange={handleChange}
              placeholder="123"
              maxLength={4}
              className={errors.card_cvv ? 'error' : ''}
            />
            {errors.card_cvv && (
              <span className="payment-form__error">{errors.card_cvv}</span>
            )}
          </div>
        </div>

        <div className="payment-form__security">
          <span className="material-symbols-outlined">lock</span>
          <span>Your payment information is secure and encrypted</span>
        </div>

        <div className="payment-form__actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="payment-form__button payment-form__button--cancel"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="payment-form__button payment-form__button--submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      <div className="payment-form__info">
        <p><strong>Escrow Protection:</strong> Your payment will be held securely until the order is completed.</p>
        <p>You can request a refund if the order is cancelled before completion.</p>
      </div>
    </div>
  );
}

export default PaymentForm;

