

let form = document.getElementById('join-form')


form.addEventListener('submit', (e) => {
    e.preventDefault()
    let inviteCode = e.target.invite_code
    window.location.href = 'room url'
})