import { useRouter } from 'next/router'

import { useMutation, useQuery } from '../../convex/_generated/react'
import { Id } from '../../convex/_generated/dataModel'
import { useRef, useState } from 'react'

export default function () {
  const router = useRouter()
  const userId = new Id('users', router.query.id as string)
  const user = useQuery('users:get', userId) || null
  const myUserId = useQuery('users:getMyUser') ?? null

  const imageInput = useRef(null)
  const [selectedImage, setSelectedImage] = useState(null)

  const generateUploadUrl = useMutation('users:generateUploadUrl')
  const setProfilePic = useMutation('users:setProfilePic')

  async function handleSetProfilePic(event: any) {
    event.preventDefault()
    setSelectedImage(null)
    ;(imageInput.current as any).value = ''

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl()
    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': (selectedImage as any).type },
      body: selectedImage,
    })
    const { storageId } = await result.json()
    // Step 3: Save the newly allocated storage id to the messages table
    await setProfilePic(storageId)
  }

  console.log()

  return (
    <main>
      {user?.profilePicUrl ? (
        <img src={user.profilePicUrl} className="profileImage" />
      ) : (
        <div className="profileImage">
          {user?.name
            ?.split(' ')
            .map((w) => w.slice(0, 1).toUpperCase())
            .join('')}
        </div>
      )}
      <div>{user?.name}</div>
      {user && user._id?.equals(myUserId) ? (
        <form onSubmit={handleSetProfilePic}>
          <input
            type="file"
            accept="image/*"
            ref={imageInput}
            onChange={(event) =>
              setSelectedImage((event.target.files as any)[0])
            }
            className="ms-2 btn btn-primary"
            disabled={selectedImage !== null}
          />
          <input
            type="submit"
            value="Change Profile Pic"
            disabled={!selectedImage}
          />
        </form>
      ) : (
        <div />
      )}
    </main>
  )
}
