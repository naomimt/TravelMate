import requests

# // POST /api/auth/register - Register a new user

# x = requests.post(
#     "http://localhost:3000/api/auth/register",
#     json={"name": "Naomi", "email": "naomi@example.com", "password": "password123"},
# )


# x = requests.post(
#     "http://localhost:3000/api/auth/login",
#     json={"email": "naomi@example.com", "password": "password123"},
# )

# x = requests.get("http://localhost:3000/api/trips")

x = requests.post(
    "http://localhost:3000/api/trips",
    json={
        "title": "Explore Paris",
        "description": "A week-long trip to explore the city of lights.",
        "available_slots": 20,
        "duration": 7,
        "price": 1500.00,
    },
    headers={
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmFvbWlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDMxMjEsImV4cCI6MTc3MDQwNzkyMX0.BW5nC-Ys13emlHD-t_XhFhzsLiqpPv9bx66HxR5dLNQ"
    },
)

# x = requests.get("http://localhost:3000/api/trips/1")

# x = requests.patch(
#     "http://localhost:3000/api/trips/1",
#     json={"price": 1400.00},
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmFvbWlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDMxMjEsImV4cCI6MTc3MDQwNzkyMX0.BW5nC-Ys13emlHD-t_XhFhzsLiqpPv9bx66HxR5dLNQ"
#     },
# )

# x = requests.delete(
#     "http://localhost:3000/api/trips/1",
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmFvbWlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDMxMjEsImV4cCI6MTc3MDQwNzkyMX0.BW5nC-Ys13emlHD-t_XhFhzsLiqpPv9bx66HxR5dLNQ"
#     },
# )

# x = requests.post(
#     "http://localhost:3000/api/bookings",
#     json={"trip_id": 2, "booking_date": "2025-01-13"},
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoia2FsZWFiQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk4MDM1MDksImV4cCI6MTc3MDQwODMwOX0.l-eJimDo_sf1zCHknxMX_MEPaE9NoEtjXx0A3XkG9xs"
#     },
# )

# x = requests.get(
#     "http://localhost:3000/api/bookings",
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoia2FsZWFiQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk4MDM1MDksImV4cCI6MTc3MDQwODMwOX0.l-eJimDo_sf1zCHknxMX_MEPaE9NoEtjXx0A3XkG9xs"
#     },
# )

# x = requests.get(
#     "http://localhost:3000/api/admin/bookings",
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmFvbWlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDM3NTMsImV4cCI6MTc3MDQwODU1M30.L0KbDUfhQ7GPPsew4via-e58lDD1hfxsYojowkkx1CE"
#     },
# )

# x = requests.patch(
#     "http://localhost:3000/api/bookings/1/status",
#     json={"status": "confirmed"},
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmFvbWlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDM3NTMsImV4cCI6MTc3MDQwODU1M30.L0KbDUfhQ7GPPsew4via-e58lDD1hfxsYojowkkx1CE"
#     },
# )

# x = requests.delete(
#     "http://localhost:3000/api/bookings/1",
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoia2FsZWFiQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk4MDM1MDksImV4cCI6MTc3MDQwODMwOX0.l-eJimDo_sf1zCHknxMX_MEPaE9NoEtjXx0A3XkG9xs"
#     },
# )
print(x.status_code)
print(x.json())
