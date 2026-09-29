package com.exceptionpro.dto;

import java.time.LocalDate;

public class ProfileUpdateRequest {

    // Individual profile details (editable)
    private String firstName;
    private String lastName;
    private LocalDate dob;
    private String gender;

    // Corporate profile details (editable)
    private String organizationName;
    private String legalName;
    private String streetAddress;
    private String city;
    private String pincode;
    private String state;
    private String country;

    // Getters and Setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }

    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    private String coverPhoto;
    private String profilePicture;
    private String about;

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }

    public String getCoverPhoto() { return coverPhoto; }
    public void setCoverPhoto(String coverPhoto) { this.coverPhoto = coverPhoto; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
